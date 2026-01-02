import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace MermaidLLM;

@route("/api/diagram")
@tag("diagram")
interface DiagramOperations {
  /**
   * Generate a Mermaid diagram from the prompt (non-streaming).
   * Returns the complete diagram once generation is finished.
   */
  @post
  generate(@body request: DiagramRequest): DiagramResponse;

  /**
   * Generate a Mermaid diagram with SSE streaming.
   * Returns a stream of events: meta, chunk, done, or error.
   *
   * Event types:
   * - `meta`: Initial metadata (trace_id, model, diagram_type, language)
   * - `chunk`: Partial mermaid code updates
   * - `done`: Final result with complete mermaid code and metadata
   * - `error`: Error event with structured error information
   */
  @post
  @route("/stream")
  stream(@body request: DiagramRequest): string;
}
