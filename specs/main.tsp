import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi";
import "@typespec/openapi3";

import "./models/diagram.tsp";
import "./models/error.tsp";
import "./models/sse.tsp";
import "./operations/diagram.tsp";
import "./operations/health.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

@service(#{ title: "Mermaid LLM Chat API" })
@server("http://localhost:8000", "Development server")
namespace MermaidLLM;
