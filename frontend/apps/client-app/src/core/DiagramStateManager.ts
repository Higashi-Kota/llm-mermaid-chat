import type { DiagramMeta, StructuredError } from "@mermaid-chat/api-client"

/**
 * Stream metadata from SSE meta event
 */
export interface StreamMeta {
  readonly traceId: string
  readonly model: string
  readonly diagramType: string
  readonly language: string
}

interface DiagramState {
  readonly isStreaming: boolean
  readonly mermaidCode: string
  readonly error: StructuredError | null
  readonly meta: StreamMeta | null
  readonly finalMeta: DiagramMeta | null
  readonly currentPrompt: string | null
  readonly currentHint: string | null
}

/**
 * Immutable manager for diagram generation state
 */
export class DiagramStateManager {
  private constructor(private readonly _state: DiagramState) {}

  static initial(): DiagramStateManager {
    return new DiagramStateManager({
      isStreaming: false,
      mermaidCode: "",
      error: null,
      meta: null,
      finalMeta: null,
      currentPrompt: null,
      currentHint: null,
    })
  }

  // === Getters ===

  get isStreaming(): boolean {
    return this._state.isStreaming
  }

  get mermaidCode(): string {
    return this._state.mermaidCode
  }

  get error(): StructuredError | null {
    return this._state.error
  }

  get meta(): StreamMeta | null {
    return this._state.meta
  }

  get finalMeta(): DiagramMeta | null {
    return this._state.finalMeta
  }

  get currentPrompt(): string | null {
    return this._state.currentPrompt
  }

  get currentHint(): string | null {
    return this._state.currentHint
  }

  // === State Transitions (returns new instance) ===

  startStreaming(prompt: string, hint: string | null): DiagramStateManager {
    return new DiagramStateManager({
      isStreaming: true,
      mermaidCode: "",
      error: null,
      meta: null,
      finalMeta: null,
      currentPrompt: prompt,
      currentHint: hint,
    })
  }

  setMeta(meta: StreamMeta): DiagramStateManager {
    return new DiagramStateManager({
      ...this._state,
      meta,
    })
  }

  updateMermaidCode(code: string): DiagramStateManager {
    if (this._state.mermaidCode === code) return this
    return new DiagramStateManager({
      ...this._state,
      mermaidCode: code,
    })
  }

  complete(
    mermaidCode: string,
    diagramType: string,
    language: string,
    errors: string[],
    meta: DiagramMeta,
  ): DiagramStateManager {
    return new DiagramStateManager({
      ...this._state,
      isStreaming: false,
      mermaidCode,
      finalMeta: meta,
      meta: {
        traceId: meta.trace_id,
        model: meta.model,
        diagramType,
        language,
      },
      error:
        errors.length > 0
          ? {
              code: "GENERATION_FAILED",
              category: "generation",
              message: errors.join("; "),
              retryable: true,
            }
          : null,
    })
  }

  setError(error: StructuredError): DiagramStateManager {
    return new DiagramStateManager({
      ...this._state,
      isStreaming: false,
      error,
    })
  }

  clearError(): DiagramStateManager {
    if (this._state.error === null) return this
    return new DiagramStateManager({
      ...this._state,
      error: null,
    })
  }

  reset(): DiagramStateManager {
    return DiagramStateManager.initial()
  }
}
