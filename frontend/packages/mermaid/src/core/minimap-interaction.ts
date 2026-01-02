import type { MinimapLayout, TransformState, ViewportBounds } from "../types"

/**
 * Convert minimap coordinates to content coordinates (union-based)
 *
 * This function handles conversion using the union bounding box, which
 * includes both content and viewport areas. No clamping is performed
 * since the union already encompasses all visible areas.
 *
 * @param minimapX X position in minimap space
 * @param minimapY Y position in minimap space
 * @param layout MinimapLayout from calculateMinimapLayout
 * @returns Position in content coordinates (NOT clamped)
 */
export function minimapToContent(
  minimapX: number,
  minimapY: number,
  layout: MinimapLayout,
): { x: number; y: number } {
  const { scale, unionBBox, svgRect } = layout

  // Calculate where union origin is in minimap coordinates
  // svgRect.x = unionOffsetX + (contentBBox.minX - unionBBox.minX) * scale
  // For content origin at (0,0): unionOffsetX = svgRect.x when contentBBox.minX = unionBBox.minX = 0
  // More generally: unionOffsetX = svgRect.x - (0 - unionBBox.minX) * scale = svgRect.x + unionBBox.minX * scale
  const unionOffsetX = svgRect.x + unionBBox.minX * scale
  const unionOffsetY = svgRect.y + unionBBox.minY * scale

  // Convert minimap coords to content coords via union
  return {
    x: (minimapX - unionOffsetX) / scale + unionBBox.minX,
    y: (minimapY - unionOffsetY) / scale + unionBBox.minY,
  }
}

/**
 * Check if a point is inside the viewport rectangle
 *
 * @param minimapX X position in minimap space
 * @param minimapY Y position in minimap space
 * @param viewportBounds Viewport bounds in minimap coordinates
 * @returns True if point is inside viewport
 */
export function isPointInViewport(
  minimapX: number,
  minimapY: number,
  viewportBounds: ViewportBounds,
): boolean {
  return (
    minimapX >= viewportBounds.x &&
    minimapX <= viewportBounds.x + viewportBounds.width &&
    minimapY >= viewportBounds.y &&
    minimapY <= viewportBounds.y + viewportBounds.height
  )
}

/**
 * Calculate transform state to center a content point in the viewport
 *
 * @param contentX X position in content coordinates
 * @param contentY Y position in content coordinates
 * @param viewportWidth Viewport width in pixels
 * @param viewportHeight Viewport height in pixels
 * @param zoom Current zoom level
 * @returns New transform state with centered position
 */
export function calculateCenterOnPoint(
  contentX: number,
  contentY: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
): TransformState {
  // Calculate pan values to center the content point in viewport
  // Content point should appear at viewport center: (viewportWidth/2, viewportHeight/2)
  // Transform: translate(panX, panY) scale(zoom)
  // Viewport center in content coords: (viewportWidth/2 - panX) / zoom
  // So: contentX = (viewportWidth/2 - panX) / zoom
  // => panX = viewportWidth/2 - contentX * zoom
  const panX = viewportWidth / 2 - contentX * zoom
  const panY = viewportHeight / 2 - contentY * zoom

  return { zoom, panX, panY }
}

/**
 * Calculate pan values from viewport drag movement (with inversion)
 *
 * When dragging the viewport rectangle on minimap:
 * - Dragging right should show content to the left (canvas moves left)
 * - This is because we're dragging the "window", not the content
 *
 * @param dragDeltaX Drag delta X in minimap pixels
 * @param dragDeltaY Drag delta Y in minimap pixels
 * @param minimapScale Scale factor of minimap
 * @param currentZoom Current zoom level
 * @param startPanX Pan X at drag start
 * @param startPanY Pan Y at drag start
 * @returns New pan values
 */
export function calculateDragPan(
  dragDeltaX: number,
  dragDeltaY: number,
  minimapScale: number,
  currentZoom: number,
  startPanX: number,
  startPanY: number,
): { panX: number; panY: number } {
  // Convert minimap pixel movement to content coordinate movement
  const contentDeltaX = dragDeltaX / minimapScale
  const contentDeltaY = dragDeltaY / minimapScale

  // INVERTED: Dragging viewport right → canvas pans left
  // This is mathematically correct: if you drag the "window" right,
  // you see content that was to its left
  return {
    panX: startPanX - contentDeltaX * currentZoom,
    panY: startPanY - contentDeltaY * currentZoom,
  }
}
