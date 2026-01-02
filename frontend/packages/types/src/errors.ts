/**
 * Structured error codes shared between backend and frontend.
 */

export const ErrorCode = {
  // Network errors
  NETWORK_DISCONNECTED: "NETWORK_DISCONNECTED",
  NETWORK_TIMEOUT: "NETWORK_TIMEOUT",

  // Generation errors
  GENERATION_FAILED: "GENERATION_FAILED",
  GENERATION_TIMEOUT: "GENERATION_TIMEOUT",
  GENERATION_EMPTY: "GENERATION_EMPTY",

  // Validation errors
  VALIDATION_SYNTAX_ERROR: "VALIDATION_SYNTAX_ERROR",
  VALIDATION_INVALID_TYPE: "VALIDATION_INVALID_TYPE",
  VALIDATION_UNBALANCED_BRACKETS: "VALIDATION_UNBALANCED_BRACKETS",
  VALIDATION_EMPTY_NODE: "VALIDATION_EMPTY_NODE",

  // Server errors
  SERVER_INTERNAL_ERROR: "SERVER_INTERNAL_ERROR",
  SERVER_DATABASE_ERROR: "SERVER_DATABASE_ERROR",

  // Rate limit errors
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Autofix errors
  AUTOFIX_FAILED: "AUTOFIX_FAILED",
  AUTOFIX_MAX_ATTEMPTS: "AUTOFIX_MAX_ATTEMPTS",
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

export type ErrorCategory =
  | "network"
  | "generation"
  | "validation"
  | "server"
  | "rate_limit"
  | "autofix"

export interface StructuredError {
  code: ErrorCodeType
  category: ErrorCategory
  message: string
  details?: string[]
  traceId: string
  retryable: boolean
}

/**
 * Localized error messages.
 */
export const ERROR_MESSAGES: Record<ErrorCodeType, { ja: string; en: string }> = {
  NETWORK_DISCONNECTED: {
    ja: "ネットワーク接続が切断されました",
    en: "Network connection lost",
  },
  NETWORK_TIMEOUT: {
    ja: "接続がタイムアウトしました",
    en: "Connection timed out",
  },
  GENERATION_FAILED: {
    ja: "図の生成に失敗しました",
    en: "Failed to generate diagram",
  },
  GENERATION_TIMEOUT: {
    ja: "生成がタイムアウトしました",
    en: "Generation timed out",
  },
  GENERATION_EMPTY: {
    ja: "空の結果が返されました",
    en: "Empty result returned",
  },
  VALIDATION_SYNTAX_ERROR: {
    ja: "Mermaid構文エラーが検出されました",
    en: "Mermaid syntax error detected",
  },
  VALIDATION_INVALID_TYPE: {
    ja: "無効な図タイプです",
    en: "Invalid diagram type",
  },
  VALIDATION_UNBALANCED_BRACKETS: {
    ja: "括弧の対応が不正です",
    en: "Unbalanced brackets in diagram",
  },
  VALIDATION_EMPTY_NODE: {
    ja: "空のノードラベルが検出されました",
    en: "Empty node label detected",
  },
  SERVER_INTERNAL_ERROR: {
    ja: "サーバー内部エラーが発生しました",
    en: "Internal server error",
  },
  SERVER_DATABASE_ERROR: {
    ja: "データベースエラーが発生しました",
    en: "Database error",
  },
  RATE_LIMIT_EXCEEDED: {
    ja: "リクエスト制限を超過しました。しばらく待ってから再試行してください",
    en: "Rate limit exceeded. Please wait and try again",
  },
  AUTOFIX_FAILED: {
    ja: "自動修正に失敗しました",
    en: "Autofix failed",
  },
  AUTOFIX_MAX_ATTEMPTS: {
    ja: "最大修正回数に達しました",
    en: "Maximum fix attempts reached",
  },
}

/**
 * Error codes that can be retried.
 */
const RETRYABLE_ERRORS: Set<ErrorCodeType> = new Set([
  ErrorCode.NETWORK_DISCONNECTED,
  ErrorCode.NETWORK_TIMEOUT,
  ErrorCode.GENERATION_TIMEOUT,
  ErrorCode.RATE_LIMIT_EXCEEDED,
  ErrorCode.SERVER_INTERNAL_ERROR,
])

/**
 * Get the category for an error code.
 */
export function getErrorCategory(code: ErrorCodeType): ErrorCategory {
  const prefix = code.split("_")[0] ?? ""
  const categoryMap: Record<string, ErrorCategory> = {
    NETWORK: "network",
    GENERATION: "generation",
    VALIDATION: "validation",
    SERVER: "server",
    RATE: "rate_limit",
    AUTOFIX: "autofix",
  }
  return categoryMap[prefix] ?? "server"
}

/**
 * Get localized error message for an error code.
 */
export function getErrorMessage(code: ErrorCodeType, lang: "ja" | "en" = "ja"): string {
  const messages = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.SERVER_INTERNAL_ERROR
  return messages[lang]
}

/**
 * Check if an error is retryable.
 */
export function isRetryable(code: ErrorCodeType): boolean {
  return RETRYABLE_ERRORS.has(code)
}

/**
 * Create a structured error object.
 */
export function createStructuredError(
  code: ErrorCodeType,
  traceId: string = "",
  details?: string[],
): StructuredError {
  return {
    code,
    category: getErrorCategory(code),
    message: getErrorMessage(code),
    details,
    traceId,
    retryable: isRetryable(code),
  }
}
