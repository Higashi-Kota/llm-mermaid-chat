import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;
using TypeSpec.Rest;

namespace MermaidLLM;

/** Health check response */
model HealthResponse {
  status: "ok";
}

@route("/health")
@tag("health")
interface HealthOperations {
  /** Check API health status */
  @get
  check(): HealthResponse;
}
