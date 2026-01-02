import type { TransformState, ZoomConstraints } from "../types"

/**
 * Default zoom constraints
 */
export const DEFAULT_ZOOM_CONSTRAINTS: ZoomConstraints = {
  minZoom: 0.1,
  maxZoom: 10,
}

/**
 * Clamp zoom value to constraints
 */
export function clampZoom(
  zoom: number,
  constraints: ZoomConstraints = DEFAULT_ZOOM_CONSTRAINTS,
): number {
  return Math.max(constraints.minZoom, Math.min(constraints.maxZoom, zoom))
}

/**
 * Zoom around a specific point (mouse position)
 *
 * @param state Current transform state
 * @param factor Zoom factor (e.g., 1.1 for zoom in, 0.9 for zoom out)
 * @param pivotX Pivot point X (relative to container)
 * @param pivotY Pivot point Y (relative to container)
 * @param constraints Zoom constraints
 * @returns New transform state
 */
export function zoomAtPoint(
  state: TransformState,
  factor: number,
  pivotX: number,
  pivotY: number,
  constraints: ZoomConstraints = DEFAULT_ZOOM_CONSTRAINTS,
): TransformState {
  const oldZoom = state.zoom
  const newZoom = clampZoom(state.zoom * factor, constraints)

  // Zoom around pivot point
  const zoomRatio = newZoom / oldZoom
  const newPanX = pivotX - (pivotX - state.panX) * zoomRatio
  const newPanY = pivotY - (pivotY - state.panY) * zoomRatio

  return {
    zoom: newZoom,
    panX: newPanX,
    panY: newPanY,
  }
}

/**
 * Calculate fit-to-viewport zoom level
 *
 * @param contentWidth Content natural width
 * @param contentHeight Content natural height
 * @param viewportWidth Viewport width
 * @param viewportHeight Viewport height
 * @param padding Optional padding to leave around content
 * @returns Zoom level that fits content in viewport
 */
export function calculateFitZoom(
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding = 40,
): number {
  const availableWidth = viewportWidth - padding * 2
  const availableHeight = viewportHeight - padding * 2

  const zoomForWidth = availableWidth / contentWidth
  const zoomForHeight = availableHeight / contentHeight

  return Math.min(zoomForWidth, zoomForHeight)
}

/**
 * Calculate centered pan position for content
 *
 * @param contentWidth Content natural width
 * @param contentHeight Content natural height
 * @param viewportWidth Viewport width
 * @param viewportHeight Viewport height
 * @param zoom Current zoom level
 * @returns Pan position to center content
 */
export function calculateCenteredPan(
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
): { panX: number; panY: number } {
  const scaledWidth = contentWidth * zoom
  const scaledHeight = contentHeight * zoom

  return {
    panX: (viewportWidth - scaledWidth) / 2,
    panY: (viewportHeight - scaledHeight) / 2,
  }
}

/**
 * Apply pan delta to current state
 *
 * @param state Current transform state
 * @param deltaX X delta to apply
 * @param deltaY Y delta to apply
 * @returns New transform state
 */
export function applyPanDelta(
  state: TransformState,
  deltaX: number,
  deltaY: number,
): TransformState {
  return {
    ...state,
    panX: state.panX + deltaX,
    panY: state.panY + deltaY,
  }
}

/**
 * Generate CSS transform string from state
 */
export function toTransformCSS(state: TransformState): string {
  return `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`
}

/**
 * Create initial transform state with fit-to-viewport
 *
 * @param contentWidth Content natural width
 * @param contentHeight Content natural height
 * @param viewportWidth Viewport width
 * @param viewportHeight Viewport height
 * @returns Initial transform state
 */
export function createInitialTransform(
  contentWidth: number,
  contentHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): TransformState {
  const zoom = calculateFitZoom(contentWidth, contentHeight, viewportWidth, viewportHeight)
  const { panX, panY } = calculateCenteredPan(
    contentWidth,
    contentHeight,
    viewportWidth,
    viewportHeight,
    zoom,
  )

  return {
    zoom,
    panX,
    panY,
  }
}
