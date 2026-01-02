import type {
  BBox,
  MinimapDimensions,
  MinimapLayout,
  SvgDimensions,
  TransformState,
  ViewportBounds,
} from "../types"

/**
 * Default minimap size
 */
export const MINIMAP_MAX_WIDTH = 200
export const MINIMAP_MAX_HEIGHT = 150
export const MINIMAP_PADDING = 8

/**
 * Minimum scale factor to prevent union from growing too large
 */
const MIN_SCALE = 0.01

/**
 * Create a BBox from ViewportBounds
 */
export function createBBox(bounds: ViewportBounds): BBox {
  return {
    minX: bounds.x,
    minY: bounds.y,
    maxX: bounds.x + bounds.width,
    maxY: bounds.y + bounds.height,
  }
}

/**
 * Create a BBox for content area
 *
 * @param contentWidth Content width
 * @param contentHeight Content height
 * @param originX ViewBox origin X (default: 0)
 * @param originY ViewBox origin Y (default: 0)
 */
export function createContentBBox(
  contentWidth: number,
  contentHeight: number,
  originX = 0,
  originY = 0,
): BBox {
  return {
    minX: originX,
    minY: originY,
    maxX: originX + contentWidth,
    maxY: originY + contentHeight,
  }
}

/**
 * Calculate the union of two bounding boxes
 */
export function calculateUnionBBox(a: BBox, b: BBox): BBox {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}

/**
 * Get dimensions from a BBox
 */
export function getBBoxDimensions(bbox: BBox): { width: number; height: number } {
  return {
    width: Math.max(1, bbox.maxX - bbox.minX),
    height: Math.max(1, bbox.maxY - bbox.minY),
  }
}

/**
 * Parse SVG natural dimensions from viewBox or width/height attributes
 *
 * ViewBox format: "minX minY width height"
 * Example: "-50 -10 850 503" means origin at (-50, -10) with size 850x503
 */
export function parseSvgDimensions(svg: SVGElement): SvgDimensions {
  const viewBox = svg.getAttribute("viewBox")

  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/)
    const minX = Number.parseFloat(parts[0] ?? "") || 0
    const minY = Number.parseFloat(parts[1] ?? "") || 0
    const width = Number.parseFloat(parts[2] ?? "") || 800
    const height = Number.parseFloat(parts[3] ?? "") || 600
    return { width, height, minX, minY }
  }

  const width =
    Number.parseFloat(svg.getAttribute("width") || "") || svg.getBoundingClientRect().width || 800
  const height =
    Number.parseFloat(svg.getAttribute("height") || "") || svg.getBoundingClientRect().height || 600

  return { width, height, minX: 0, minY: 0 }
}

/**
 * Calculate minimap dimensions based on content aspect ratio
 *
 * @param contentWidth Content natural width
 * @param contentHeight Content natural height
 * @param maxWidth Maximum minimap width
 * @param maxHeight Maximum minimap height
 * @returns Minimap dimensions with scale
 */
export function calculateMinimapDimensions(
  contentWidth: number,
  contentHeight: number,
  maxWidth: number = MINIMAP_MAX_WIDTH - MINIMAP_PADDING * 2,
  maxHeight: number = MINIMAP_MAX_HEIGHT - MINIMAP_PADDING * 2,
): MinimapDimensions {
  const scale = Math.min(maxWidth / contentWidth, maxHeight / contentHeight)

  return {
    width: contentWidth * scale,
    height: contentHeight * scale,
    scale,
  }
}

/**
 * Calculate visible viewport bounds in content coordinates
 *
 * @param state Current transform state
 * @param viewportWidth Viewport width
 * @param viewportHeight Viewport height
 * @param contentOriginX ViewBox origin X (default: 0)
 * @param contentOriginY ViewBox origin Y (default: 0)
 * @returns Visible bounds in content coordinates (SVG coordinate system)
 */
export function calculateVisibleBounds(
  state: TransformState,
  viewportWidth: number,
  viewportHeight: number,
  contentOriginX = 0,
  contentOriginY = 0,
): ViewportBounds {
  // The transform is: translate(panX, panY) scale(zoom)
  // SVG viewBox maps internal coords (minX, minY) to wrapper position (0, 0)
  // Screen coord (0, 0) corresponds to SVG coord: minX - panX/zoom, minY - panY/zoom

  // Guard against zero/invalid viewport dimensions
  const safeWidth = Math.max(1, viewportWidth)
  const safeHeight = Math.max(1, viewportHeight)

  return {
    x: contentOriginX - state.panX / state.zoom,
    y: contentOriginY - state.panY / state.zoom,
    width: safeWidth / state.zoom,
    height: safeHeight / state.zoom,
  }
}

/**
 * Calculate union-based minimap layout
 *
 * This function computes a layout where both the SVG content AND the viewport
 * are always visible in the minimap. When the viewport extends beyond the
 * content bounds, the minimap dynamically scales to show both.
 *
 * @param state Current transform state
 * @param viewportWidth Viewport width in pixels
 * @param viewportHeight Viewport height in pixels
 * @param contentWidth Content natural width
 * @param contentHeight Content natural height
 * @param contentOriginX ViewBox origin X (default: 0)
 * @param contentOriginY ViewBox origin Y (default: 0)
 * @returns MinimapLayout with scale, unionBBox, svgRect, and viewportRect
 */
export function calculateMinimapLayout(
  state: TransformState,
  viewportWidth: number,
  viewportHeight: number,
  contentWidth: number,
  contentHeight: number,
  contentOriginX = 0,
  contentOriginY = 0,
): MinimapLayout {
  // 1. Content bounding box (using viewBox origin)
  const contentBBox = createContentBBox(contentWidth, contentHeight, contentOriginX, contentOriginY)

  // 2. Viewport bounding box in content coordinates (SVG coordinate system)
  const visibleBounds = calculateVisibleBounds(
    state,
    viewportWidth,
    viewportHeight,
    contentOriginX,
    contentOriginY,
  )
  const viewportBBox = createBBox(visibleBounds)

  // 3. Union of content and viewport
  const unionBBox = calculateUnionBBox(contentBBox, viewportBBox)
  const { width: unionWidth, height: unionHeight } = getBBoxDimensions(unionBBox)

  // 4. Scale to fit union in minimap (with padding)
  const usableWidth = MINIMAP_MAX_WIDTH - MINIMAP_PADDING * 2
  const usableHeight = MINIMAP_MAX_HEIGHT - MINIMAP_PADDING * 2
  const scale = Math.max(MIN_SCALE, Math.min(usableWidth / unionWidth, usableHeight / unionHeight))

  // 5. Center the union in minimap
  const scaledUnionWidth = unionWidth * scale
  const scaledUnionHeight = unionHeight * scale
  const unionOffsetX = MINIMAP_PADDING + (usableWidth - scaledUnionWidth) / 2
  const unionOffsetY = MINIMAP_PADDING + (usableHeight - scaledUnionHeight) / 2

  // 6. SVG thumbnail position (relative to union)
  const svgRect: ViewportBounds = {
    x: unionOffsetX + (contentBBox.minX - unionBBox.minX) * scale,
    y: unionOffsetY + (contentBBox.minY - unionBBox.minY) * scale,
    width: contentWidth * scale,
    height: contentHeight * scale,
  }

  // 7. Viewport indicator position (relative to union)
  const viewportRect: ViewportBounds = {
    x: unionOffsetX + (viewportBBox.minX - unionBBox.minX) * scale,
    y: unionOffsetY + (viewportBBox.minY - unionBBox.minY) * scale,
    width: visibleBounds.width * scale,
    height: visibleBounds.height * scale,
  }

  return { scale, unionBBox, svgRect, viewportRect }
}
