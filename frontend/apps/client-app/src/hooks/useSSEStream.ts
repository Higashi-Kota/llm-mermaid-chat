import type { DiagramResponse } from "@mermaid-chat/types"
import { useCallback, useRef, useState } from "react"

type StreamState = {
  isStreaming: boolean
  mermaidCode: string
  error: string | null
  meta: {
    traceId: string
    model: string
    diagramType: string
    language: string
  } | null
}

type UseSSEStreamReturn = StreamState & {
  startStream: (prompt: string) => Promise<void>
  cancelStream: () => void
}

export function useSSEStream(apiUrl: string = ""): UseSSEStreamReturn {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    mermaidCode: "",
    error: null,
    meta: null,
  })
  const abortControllerRef = useRef<AbortController | null>(null)

  const startStream = useCallback(
    async (prompt: string) => {
      // Cancel any existing stream
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      setState({ isStreaming: true, mermaidCode: "", error: null, meta: null })

      try {
        const response = await fetch(`${apiUrl}/api/diagram/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        if (!response.body) {
          throw new Error("No response body")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        const processEventBlock = (eventBlock: string) => {
          if (!eventBlock.trim()) return

          const lines = eventBlock.split("\n")
          let eventType = ""
          let data = ""

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith("data: ")) {
              data = line.slice(6).trim()
            }
          }

          if (!eventType || !data) return

          try {
            const parsed = JSON.parse(data)

            switch (eventType) {
              case "meta":
                setState((s) => ({
                  ...s,
                  meta: {
                    traceId: parsed.trace_id,
                    model: parsed.model,
                    diagramType: parsed.diagram_type,
                    language: parsed.language,
                  },
                }))
                break
              case "chunk":
                setState((s) => ({
                  ...s,
                  mermaidCode: parsed.text,
                }))
                break
              case "done": {
                const result = parsed as DiagramResponse
                setState((s) => ({
                  ...s,
                  isStreaming: false,
                  mermaidCode: result.mermaid_code,
                  meta: s.meta
                    ? {
                        ...s.meta,
                        diagramType: result.diagram_type,
                        language: result.language,
                      }
                    : null,
                }))
                break
              }
              case "error":
                setState((s) => ({
                  ...s,
                  isStreaming: false,
                  error: parsed.message,
                }))
                break
            }
          } catch {
            // Ignore JSON parse errors
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk
          const events = buffer.split("\n\n")
          buffer = events.pop() || ""

          for (const eventBlock of events) {
            processEventBlock(eventBlock)
          }
        }

        // Process any remaining data in buffer after stream ends
        if (buffer.trim()) {
          processEventBlock(buffer)
        }

        // Ensure streaming is marked as complete
        setState((s) => ({ ...s, isStreaming: false }))
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setState((s) => ({
            ...s,
            isStreaming: false,
            error: (err as Error).message,
          }))
        }
      }
    },
    [apiUrl],
  )

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
    setState((s) => ({ ...s, isStreaming: false }))
  }, [])

  return { ...state, startStream, cancelStream }
}
