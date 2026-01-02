import "@typespec/http";

using TypeSpec.Http;

namespace MermaidLLM;

/** Error codes for structured error handling */
enum ErrorCode {
  // Network errors
  NETWORK_DISCONNECTED,
  NETWORK_TIMEOUT,
  NETWORK_UNKNOWN,

  // Generation errors
  GENERATION_FAILED,
  GENERATION_TIMEOUT,
  GENERATION_EMPTY,
  GENERATION_INVALID,

  // Validation errors
  VALIDATION_SYNTAX_ERROR,
  VALIDATION_PARSE_ERROR,
  VALIDATION_UNKNOWN,

  // Rate limit errors
  RATE_LIMIT_EXCEEDED,

  // Server errors
  SERVER_INTERNAL_ERROR,
  SERVER_UNAVAILABLE,

  // Unknown errors
  UNKNOWN_ERROR,
}

/** Error categories for grouping related errors */
enum ErrorCategory {
  network,
  generation,
  validation,
  rate_limit,
  server,
  unknown_category: "unknown",
}

/** Structured error response */
model StructuredError {
  /** Error code for programmatic handling */
  code: ErrorCode;

  /** Error category for grouping */
  category: ErrorCategory;

  /** Human-readable error message */
  message: string;

  /** Additional error details */
  details?: string[];

  /** Trace ID for debugging */
  @encodedName("application/json", "trace_id")
  traceId?: string;

  /** Whether the operation can be retried */
  retryable: boolean;
}
