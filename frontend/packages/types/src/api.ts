/**
 * Diagram request payload
 */
export interface DiagramRequest {
  prompt: string
  language_hint?: "auto" | "ja" | "en"
  diagram_type_hint?:
    | "auto"
    | "flowchart"
    | "sequence"
    | "gantt"
    | "class"
    | "er"
    | "state"
    | "journey"
}

/**
 * Diagram response metadata
 */
export interface DiagramMeta {
  model: string
  latency_ms: number
  attempts: number
  trace_id?: string
}

/**
 * Diagram response (non-streaming)
 */
export interface DiagramResponse {
  mermaid_code: string
  diagram_type: string
  language: string
  errors: string[]
  meta: DiagramMeta
}

/**
 * SSE event types
 */
export type SSEEventMeta = {
  type: "meta"
  data: {
    trace_id: string
    model: string
    diagram_type: string
    language: string
  }
}

export type SSEEventChunk = {
  type: "chunk"
  data: {
    text: string
  }
}

export type SSEEventDone = {
  type: "done"
  data: DiagramResponse
}

export type SSEEventError = {
  type: "error"
  data: {
    code: string
    category: string
    message: string
    details?: string[]
    trace_id: string
    retryable: boolean
  }
}

export type SSEEvent = SSEEventMeta | SSEEventChunk | SSEEventDone | SSEEventError
