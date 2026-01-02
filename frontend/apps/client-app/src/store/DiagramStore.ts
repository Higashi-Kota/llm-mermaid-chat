import type {
  DiagramMeta,
  SSEDoneEvent,
  SSEMetaEvent,
  StructuredError,
} from "@mermaid-chat/api-client"
import { DiagramStateManager, type StreamMeta } from "../core/DiagramStateManager"
import { type ConnectionStatus, SSEConnectionManager } from "../core/SSEConnectionManager"

/**
 * Diagram store snapshot for useSyncExternalStore
 */
export interface DiagramSnapshot {
  readonly connectionStatus: ConnectionStatus
  readonly retryCount: number
  readonly isStreaming: boolean
  readonly mermaidCode: string
  readonly error: StructuredError | null
  readonly meta: StreamMeta | null
  readonly finalMeta: DiagramMeta | null
}

interface DiagramStoreConfig {
  readonly apiUrl: string
  readonly onComplete?: (response: SSEDoneEvent) => void
}

/**
 * DiagramStore - External store for diagram generation with SSE streaming
 *
 * Uses useSyncExternalStore protocol for React integration.
 * Manages SSE connection and diagram state through immutable managers.
 */
export class DiagramStore {
  private _connection: SSEConnectionManager
  private _diagram: DiagramStateManager
  private _abortController: AbortController | null = null
  private readonly _listeners = new Set<() => void>()
  private _snapshot: DiagramSnapshot | null = null
  private readonly _config: DiagramStoreConfig

  private constructor(config: DiagramStoreConfig) {
    this._config = config
    this._connection = SSEConnectionManager.initial()
    this._diagram = DiagramStateManager.initial()
  }

  /**
   * Factory method
   */
  static create(apiUrl: string, onComplete?: (response: SSEDoneEvent) => void): DiagramStore {
    return new DiagramStore({ apiUrl, onComplete })
  }

  // ==========================================
  // useSyncExternalStore API
  // ==========================================

  /**
   * Subscribe to store changes
   */
  subscribe = (listener: () => void): (() => void) => {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  /**
   * Get current snapshot (returns same reference if unchanged)
   */
  getSnapshot = (): DiagramSnapshot => {
    if (this._snapshot === null) {
      this._snapshot = this.createSnapshot()
    }
    return this._snapshot
  }

  private notify(): void {
    this._snapshot = null
    for (const listener of this._listeners) {
      listener()
    }
  }

  private createSnapshot(): DiagramSnapshot {
    return {
      connectionStatus: this._connection.status,
      retryCount: this._connection.retryCount,
      isStreaming: this._diagram.isStreaming,
      mermaidCode: this._diagram.mermaidCode,
      error: this._diagram.error,
      meta: this._diagram.meta,
      finalMeta: this._diagram.finalMeta,
    }
  }

  // ==========================================
  // Actions
  // ==========================================

  /**
   * Start streaming diagram generation
   */
  async startStream(prompt: string, diagramTypeHint?: string | null): Promise<void> {
    // Cancel any existing stream
    this.cancelStream()

    // Reset state and start connecting
    this._diagram = this._diagram.startStreaming(prompt, diagramTypeHint ?? null)
    this._connection = this._connection.connecting()
    this.notify()

    this._abortController = new AbortController()

    try {
      const response = await fetch(`${this._config.apiUrl}/api/diagram/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          prompt,
          diagram_type_hint: diagramTypeHint === "auto" ? null : diagramTypeHint,
        }),
        signal: this._abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("No response body")
      }

      this._connection = this._connection.connected()
      this.notify()

      await this.processSSEStream(response.body)
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Cancelled intentionally, just disconnect
        this._connection = this._connection.disconnected()
        this.notify()
        return
      }

      this._connection = this._connection.disconnected()
      this._diagram = this._diagram.setError({
        code: "NETWORK_DISCONNECTED",
        category: "network",
        message: error instanceof Error ? error.message : "接続エラー",
        retryable: true,
      })
      this.notify()
    }
  }

  private async processSSEStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          this.processSSELine(line)
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        this.processSSELine(buffer)
      }
    } finally {
      reader.releaseLock()
      this._connection = this._connection.disconnected()
      this.notify()
    }
  }

  private processSSELine(line: string): void {
    if (line.startsWith("id:")) {
      const id = line.slice(3).trim()
      this._connection = this._connection.setLastEventId(id)
      return
    }

    if (line.startsWith("event:")) {
      // Event type is handled with the next data line
      return
    }

    if (line.startsWith("data:")) {
      const jsonStr = line.slice(5).trim()
      if (!jsonStr) return

      try {
        const data = JSON.parse(jsonStr)
        this.handleSSEData(data)
      } catch {
        // Ignore malformed JSON
      }
    }
  }

  private handleSSEData(data: unknown): void {
    if (!data || typeof data !== "object") return

    // Meta event
    if ("trace_id" in data && "model" in data && !("mermaid_code" in data)) {
      const meta = data as SSEMetaEvent
      this._diagram = this._diagram.setMeta({
        traceId: meta.trace_id,
        model: meta.model,
        diagramType: meta.diagram_type,
        language: meta.language,
      })
      this.notify()
      return
    }

    // Chunk event
    if ("text" in data) {
      const chunk = data as { text: string }
      this._diagram = this._diagram.updateMermaidCode(chunk.text)
      this.notify()
      return
    }

    // Done event
    if ("mermaid_code" in data && "meta" in data) {
      const done = data as SSEDoneEvent
      this._diagram = this._diagram.complete(
        done.mermaid_code,
        done.diagram_type,
        done.language,
        done.errors,
        done.meta,
      )
      this._connection = this._connection.disconnected()
      this.notify()

      // Call completion callback
      if (this._config.onComplete) {
        this._config.onComplete(done)
      }
      return
    }

    // Error event
    if ("code" in data && "category" in data && "message" in data) {
      const error = data as StructuredError
      this._diagram = this._diagram.setError(error)
      this._connection = this._connection.disconnected()
      this.notify()
    }
  }

  /**
   * Cancel the current stream
   */
  cancelStream(): void {
    if (this._abortController) {
      this._abortController.abort()
      this._abortController = null
    }
  }

  /**
   * Retry the last request
   */
  retry(): void {
    const prompt = this._diagram.currentPrompt
    const hint = this._diagram.currentHint

    if (prompt) {
      this._connection = this._connection.reconnecting()
      this.notify()
      this.startStream(prompt, hint)
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._diagram = this._diagram.clearError()
    this.notify()
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.cancelStream()
    this._connection = this._connection.reset()
    this._diagram = this._diagram.reset()
    this.notify()
  }
}
