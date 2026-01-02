import { toBlob } from "html-to-image"

export interface ExportOptions {
  filename?: string
  scale?: number
  backgroundColor?: string
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export SVG content as downloadable file
 */
export function exportSvg(svgContent: string, filename = "diagram.svg"): void {
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" })
  downloadBlob(blob, filename)
}

/**
 * Export SVG element as PNG
 */
export async function exportPng(
  svgElement: SVGElement,
  options: ExportOptions = {},
): Promise<void> {
  const { filename = "diagram.png", scale = 2, backgroundColor = "#ffffff" } = options

  // html-to-image supports SVG elements at runtime despite stricter types
  const blob = await toBlob(svgElement as unknown as HTMLElement, {
    pixelRatio: scale,
    backgroundColor,
    cacheBust: true,
  })

  if (blob) {
    downloadBlob(blob, filename)
  }
}

/**
 * Generate timestamp-based filename
 */
export function generateFilename(extension: "svg" | "png"): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  return `diagram-${timestamp}.${extension}`
}
