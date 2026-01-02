import "@typespec/http";

using TypeSpec.Http;

namespace MermaidLLM;

/**
 * SSE Event Types for streaming diagram generation.
 * These models document the SSE event structure but are not directly
 * used in OpenAPI since SSE responses are text/event-stream.
 */

/** Initial metadata event sent at stream start */
model SSEMetaEvent {
  @encodedName("application/json", "trace_id")
  traceId: string;

  @encodedName("application/json", "model")
  modelName: string;

  @encodedName("application/json", "diagram_type")
  diagramType: string;

  language: string;
}

/** Chunk event containing partial mermaid code */
model SSEChunkEvent {
  text: string;
}

/** Completion event with final result */
model SSEDoneEvent {
  @encodedName("application/json", "mermaid_code")
  mermaidCode: string;

  @encodedName("application/json", "diagram_type")
  diagramType: string;

  language: string;

  errors: string[];

  meta: DiagramMeta;
}

/** Error event sent when generation fails */
model SSEErrorEvent {
  code: string;
  category: string;
  message: string;
  details?: string[];
  @encodedName("application/json", "trace_id")
  traceId: string;
  retryable: boolean;
}
