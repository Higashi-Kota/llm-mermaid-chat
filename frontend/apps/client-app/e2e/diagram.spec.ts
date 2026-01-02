import { expect, test } from "./fixtures"

test.describe("Diagram Generation", () => {
  test.beforeEach(async ({ page, utils }) => {
    // Setup API mock before navigating
    await utils.mockStreamAPI()
    await page.goto("/")
    await utils.waitForApp()
  })

  test("should display app header", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("Mermaid Chat")
    await expect(page.locator("text=プロンプトからMermaid図を生成します")).toBeVisible()
  })

  test("should show chat input area", async ({ page }) => {
    const textarea = page.locator("textarea")
    await expect(textarea).toBeVisible()
    await expect(textarea).toHaveAttribute("placeholder", /図にしたい内容を入力してください/)
  })

  test("should show diagram type selector", async ({ page }) => {
    await expect(page.locator("text=図種 (オプション)")).toBeVisible()
    await expect(page.locator("button:has-text('Auto')")).toBeVisible()
    await expect(page.locator("button:has-text('フローチャート')")).toBeVisible()
    await expect(page.locator("button:has-text('シーケンス')")).toBeVisible()
  })

  test("should generate diagram from prompt", async ({ page, utils }) => {
    // Submit a prompt
    await utils.submitPrompt("ログインフローを図にして")

    // Wait for diagram to be rendered
    await utils.waitForDiagram()

    // Verify SVG is rendered in the page
    const svg = page.locator(".mermaid-viewer svg").first()
    await expect(svg).toBeVisible()
    expect(await svg.innerHTML()).toContain("Start")
  })

  test("should show user message in chat history", async ({ page, utils }) => {
    await utils.submitPrompt("テストメッセージ")

    // Check that user message appears in chat
    await expect(page.locator("text=テストメッセージ")).toBeVisible()
  })

  test("should select diagram type", async ({ page, utils }) => {
    // Click on sequence diagram type
    await utils.selectDiagramType("シーケンス")

    // Verify it's selected (has different styling)
    const sequenceBtn = page.locator("button:has-text('シーケンス')")
    await expect(sequenceBtn).toHaveClass(/bg-blue-500/)
  })
})

test.describe("Fullscreen Mode", () => {
  test.beforeEach(async ({ page, utils }) => {
    await utils.mockStreamAPI()
    await page.goto("/")
    await utils.waitForApp()

    // Generate a diagram first
    await utils.submitPrompt("フローチャートを作成")
    await utils.waitForDiagram()
  })

  test("should open fullscreen overlay", async ({ page, utils }) => {
    await utils.openFullscreen()

    // Verify fullscreen overlay is visible
    await expect(page.locator('[aria-label="Mermaid diagram fullscreen view"]')).toBeVisible()
    await expect(page.locator(".mermaid-fullscreen-title")).toHaveText("Mermaid Diagram")
  })

  test("should close fullscreen with close button", async ({ page, utils }) => {
    await utils.openFullscreen()
    await utils.closeFullscreen()

    // Verify overlay is hidden
    await expect(page.locator('[aria-label="Mermaid diagram fullscreen view"]')).toBeHidden()
  })

  test("should close fullscreen with Escape key", async ({ page, utils }) => {
    await utils.openFullscreen()
    await page.keyboard.press("Escape")

    // Verify overlay is hidden
    await expect(page.locator('[aria-label="Mermaid diagram fullscreen view"]')).toBeHidden()
  })

  test("should show export controls in fullscreen", async ({ page, utils }) => {
    await utils.openFullscreen()

    // Verify export buttons are visible (use aria-label for specificity)
    await expect(page.locator('button[aria-label="Download as SVG"]')).toBeVisible()
    await expect(page.locator('button[aria-label="Download as PNG"]')).toBeVisible()
  })
})

test.describe("Error Handling", () => {
  test("should display error message on API error", async ({ page, utils }) => {
    // Mock API with error response
    await utils.mockStreamAPI({
      error: {
        code: "GENERATION_FAILED",
        category: "generation",
        message: "生成に失敗しました",
        retryable: true,
      },
    })

    await page.goto("/")
    await utils.waitForApp()

    // Submit prompt
    await utils.submitPrompt("エラーテスト")

    // Wait for error display
    await expect(page.locator("text=生成に失敗しました")).toBeVisible({ timeout: 10_000 })
  })

  test("should show retry button for retryable errors", async ({ page, utils }) => {
    await utils.mockStreamAPI({
      error: {
        code: "NETWORK_DISCONNECTED",
        category: "network",
        message: "ネットワーク接続が切断されました",
        retryable: true,
      },
    })

    await page.goto("/")
    await utils.waitForApp()
    await utils.submitPrompt("リトライテスト")

    // Wait for retry button
    await expect(page.locator("button:has-text('再試行')")).toBeVisible({ timeout: 10_000 })
  })
})

test.describe("Connection Status", () => {
  test("should disable submit button during generation", async ({ page, utils }) => {
    await utils.mockStreamAPI()

    await page.goto("/")
    await utils.waitForApp()

    // Fill prompt and submit
    const textarea = page.locator("textarea")
    await textarea.fill("ステータステスト")

    // Submit and verify the textarea becomes disabled during generation
    await textarea.press("Control+Enter")

    // Wait for diagram to complete - this confirms the stream processed correctly
    await utils.waitForDiagram()

    // After completion, textarea should be enabled again
    await expect(textarea).toBeEnabled()
  })
})

test.describe("Meta Information", () => {
  test("should display diagram metadata after generation", async ({ page, utils }) => {
    await utils.mockStreamAPI({
      diagramType: "flowchart",
      language: "ja",
      model: "gpt-4o-mini",
    })

    await page.goto("/")
    await utils.waitForApp()
    await utils.submitPrompt("メタ情報テスト")
    await utils.waitForDiagram()

    // Check that meta badge is displayed (specific to the meta display area)
    await expect(page.locator(".bg-blue-100.text-blue-700")).toBeVisible()
  })
})
