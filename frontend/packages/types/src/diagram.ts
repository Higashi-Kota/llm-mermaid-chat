/**
 * Supported diagram types
 */
export type DiagramType = "flowchart" | "sequence" | "gantt" | "class" | "er" | "state" | "journey"

/**
 * Supported languages
 */
export type Language = "ja" | "en" | "other"

/**
 * Diagram generation status
 */
export type DiagramStatus = "pending" | "completed" | "failed" | "cancelled"
