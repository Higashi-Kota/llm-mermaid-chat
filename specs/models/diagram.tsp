import "@typespec/http";

using TypeSpec.Http;

namespace MermaidLLM;

/** Supported diagram types */
enum DiagramType {
  flowchart,
  sequence,
  gantt,
  class_diagram: "class",
  er,
  state,
  journey,
}

/** Supported languages for generation */
enum Language {
  ja,
  en,
  other,
}

/** Request to generate a Mermaid diagram */
model DiagramRequest {
  /** User's prompt describing the diagram to generate */
  prompt: string;

  /** Optional hint for diagram type (null or "auto" = auto-detect) */
  @encodedName("application/json", "diagram_type_hint")
  diagramTypeHint?: string | null;

  /** Optional hint for output language (null or "auto" = auto-detect) */
  @encodedName("application/json", "language_hint")
  languageHint?: string | null;
}

/** Metadata about diagram generation */
model DiagramMeta {
  /** Model used for generation */
  @encodedName("application/json", "model")
  modelName: string;

  /** Time taken in milliseconds */
  @encodedName("application/json", "latency_ms")
  latencyMs: int32;

  /** Number of generation attempts */
  attempts: int32;

  /** Unique trace identifier */
  @encodedName("application/json", "trace_id")
  traceId: string;
}

/** Response from diagram generation */
model DiagramResponse {
  /** Generated Mermaid code */
  @encodedName("application/json", "mermaid_code")
  mermaidCode: string;

  /** Detected or specified diagram type */
  @encodedName("application/json", "diagram_type")
  diagramType: DiagramType;

  /** Detected or specified language */
  language: Language;

  /** List of errors encountered during generation */
  errors: string[];

  /** Generation metadata */
  meta: DiagramMeta;
}
