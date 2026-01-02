import { test as base, type Route } from "@playwright/test"

/**
 * SSE stream mock data for testing
 */
export interface MockStreamConfig {
  traceId?: string
  model?: string
  diagramType?: string
  language?: string
  mermaidCode?: string
  /** Delay between SSE events in ms */
  chunkDelay?: number
  /** If set, simulate an error */
  error?: {
    code: string
    category: string
    message: string
    retryable?: boolean
  }
}

const DEFAULT_MOCK_CONFIG: Required<Omit<MockStreamConfig, "error">> = {
  traceId: "test-trace-123",
  model: "gpt-4o-mini",
  diagramType: "flowchart",
  language: "ja",
  mermaidCode: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[End]
    B -->|No| A`,
  chunkDelay: 50,
}

/**
 * Create SSE response body for streaming
 */
function createSSEStream(config: MockStreamConfig): string {
  const cfg = { ...DEFAULT_MOCK_CONFIG, ...config }
  const events: string[] = []
  let eventId = 1

  // Meta event
  events.push(
    `id: ${cfg.traceId}:${eventId++}\n` +
      `event: meta\n` +
      `data: ${JSON.stringify({
        trace_id: cfg.traceId,
        model: cfg.model,
        diagram_type: cfg.diagramType,
        language: cfg.language,
      })}\n\n`,
  )

  if (config.error) {
    // Error event
    events.push(
      `id: ${cfg.traceId}:${eventId++}\n` +
        `event: error\n` +
        `data: ${JSON.stringify({
          code: config.error.code,
          category: config.error.category,
          message: config.error.message,
          trace_id: cfg.traceId,
          retryable: config.error.retryable ?? true,
        })}\n\n`,
    )
  } else {
    // Simulate streaming chunks
    const lines = cfg.mermaidCode.split("\n")
    let accumulated = ""
    for (const line of lines) {
      accumulated += (accumulated ? "\n" : "") + line
      events.push(
        `id: ${cfg.traceId}:${eventId++}\n` +
          `event: chunk\n` +
          `data: ${JSON.stringify({ text: accumulated })}\n\n`,
      )
    }

    // Done event
    events.push(
      `id: ${cfg.traceId}:${eventId++}\n` +
        `event: done\n` +
        `data: ${JSON.stringify({
          mermaid_code: cfg.mermaidCode,
          diagram_type: cfg.diagramType,
          language: cfg.language,
          errors: [],
          meta: {
            model: cfg.model,
            latency_ms: 100,
            attempts: 1,
            trace_id: cfg.traceId,
          },
        })}\n\n`,
    )
  }

  return events.join("")
}

/**
 * Extended test utilities
 */
interface TestUtils {
  /**
   * Mock the SSE stream API with custom config
   */
  mockStreamAPI: (config?: MockStreamConfig) => Promise<void>

  /**
   * Wait for the app to be ready
   */
  waitForApp: () => Promise<void>

  /**
   * Submit a prompt in the chat input
   */
  submitPrompt: (prompt: string) => Promise<void>

  /**
   * Wait for the diagram to be rendered
   */
  waitForDiagram: () => Promise<void>

  /**
   * Get the current mermaid code from the rendered diagram
   */
  getDiagramSvg: () => Promise<string | null>

  /**
   * Click a diagram type chip
   */
  selectDiagramType: (type: string) => Promise<void>

  /**
   * Open fullscreen overlay
   */
  openFullscreen: () => Promise<void>

  /**
   * Close fullscreen overlay
   */
  closeFullscreen: () => Promise<void>
}

/**
 * Extended test fixture with utilities
 */
export const test = base.extend<{ utils: TestUtils }>({
  utils: async ({ page }, use) => {
    const utils: TestUtils = {
      async mockStreamAPI(config: MockStreamConfig = {}) {
        await page.route("**/api/diagram/stream", async (route: Route) => {
          const sseBody = createSSEStream(config)

          await route.fulfill({
            status: 200,
            contentType: "text/event-stream",
            headers: {
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
            body: sseBody,
          })
        })
      },

      async waitForApp() {
        await page.waitForSelector('h1:has-text("Mermaid Chat")', { timeout: 10_000 })
      },

      async submitPrompt(prompt: string) {
        const textarea = page.locator("textarea")
        await textarea.fill(prompt)
        await textarea.press("Control+Enter")
      },

      async waitForDiagram() {
        // Wait for SVG to be rendered inside the mermaid viewer
        await page.waitForSelector(".mermaid-viewer svg", { timeout: 15_000 })
      },

      async getDiagramSvg() {
        const svg = page.locator(".mermaid-viewer svg").first()
        if (await svg.isVisible()) {
          return await svg.innerHTML()
        }
        return null
      },

      async selectDiagramType(type: string) {
        const chip = page.locator(`button:has-text("${type}")`)
        await chip.click()
      },

      async openFullscreen() {
        // Click the expand button
        const expandBtn = page.locator(
          'button[aria-label*="fullscreen"], button:has(svg.lucide-maximize2)',
        )
        await expandBtn.click()
        await page.waitForSelector('[aria-label="Mermaid diagram fullscreen view"]', {
          timeout: 5_000,
        })
      },

      async closeFullscreen() {
        const closeBtn = page.locator('button[aria-label*="Close fullscreen"]')
        await closeBtn.click()
        await page.waitForSelector('[aria-label="Mermaid diagram fullscreen view"]', {
          state: "hidden",
          timeout: 5_000,
        })
      },
    }

    await use(utils)
  },
})

export { expect } from "@playwright/test"
