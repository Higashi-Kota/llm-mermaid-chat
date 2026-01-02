import { useRef, useState } from "react"
import {
  calculateCenterOnPoint,
  calculateDragPan,
  isPointInViewport,
  minimapToContent,
} from "../core/minimap-interaction"
import { calculateMinimapLayout, MINIMAP_MAX_HEIGHT, MINIMAP_MAX_WIDTH } from "../core/viewport"
import type { MinimapDragState, MinimapProps } from "../types"

const INITIAL_DRAG_STATE: MinimapDragState = {
  isDragging: false,
  mode: "none",
  startX: 0,
  startY: 0,
  startPanX: 0,
  startPanY: 0,
}

/**
 * Interactive minimap overlay showing current viewport position
 *
 * Uses union-based scaling to ensure both content AND viewport
 * are always visible in the minimap, regardless of zoom/pan state.
 *
 * Supports:
 * - Click to navigate: Click anywhere to center that point
 * - Viewport drag: Drag the viewport rectangle to pan (inverted direction)
 * - Outside drag: Drag from outside viewport to continuously navigate
 */
export function Minimap({
  svgContent,
  contentWidth,
  contentHeight,
  contentOriginX = 0,
  contentOriginY = 0,
  className = "",
  transformState,
  viewportWidth,
  viewportHeight,
  onNavigate,
}: MinimapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<MinimapDragState>(INITIAL_DRAG_STATE)

  // Don't render if viewport size is invalid (not yet measured)
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return null
  }

  // Calculate union-based layout (content + viewport always visible)
  const layout = calculateMinimapLayout(
    transformState,
    viewportWidth,
    viewportHeight,
    contentWidth,
    contentHeight,
    contentOriginX,
    contentOriginY,
  )

  /**
   * Handle pointer down: Start drag or navigate on click
   */
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!onNavigate || !containerRef.current) return
    e.preventDefault()

    const rect = containerRef.current.getBoundingClientRect()
    const miniX = e.clientX - rect.left
    const miniY = e.clientY - rect.top

    // Check if clicking inside viewport rectangle
    const inViewport = isPointInViewport(miniX, miniY, layout.viewportRect)

    if (inViewport) {
      // Start viewport drag mode
      setDragState({
        isDragging: true,
        mode: "viewport",
        startX: miniX,
        startY: miniY,
        startPanX: transformState.panX,
        startPanY: transformState.panY,
      })
    } else {
      // Click outside viewport: Navigate to that position immediately
      const contentPos = minimapToContent(miniX, miniY, layout)
      const newState = calculateCenterOnPoint(
        contentPos.x,
        contentPos.y,
        viewportWidth,
        viewportHeight,
        transformState.zoom,
      )
      onNavigate(newState)

      // Start outside drag mode for continuous navigation
      setDragState({
        isDragging: true,
        mode: "outside",
        startX: miniX,
        startY: miniY,
        startPanX: newState.panX,
        startPanY: newState.panY,
      })
    }

    // Capture pointer for smooth dragging
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  /**
   * Handle pointer move: Update pan during drag
   */
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.isDragging || !onNavigate || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const miniX = e.clientX - rect.left
    const miniY = e.clientY - rect.top

    if (dragState.mode === "viewport") {
      // Viewport drag: Apply inverted movement
      const dx = miniX - dragState.startX
      const dy = miniY - dragState.startY
      const { panX, panY } = calculateDragPan(
        dx,
        dy,
        layout.scale,
        transformState.zoom,
        dragState.startPanX,
        dragState.startPanY,
      )
      onNavigate({ ...transformState, panX, panY })
    } else if (dragState.mode === "outside") {
      // Outside drag: Follow pointer position
      const contentPos = minimapToContent(miniX, miniY, layout)
      const newState = calculateCenterOnPoint(
        contentPos.x,
        contentPos.y,
        viewportWidth,
        viewportHeight,
        transformState.zoom,
      )
      onNavigate(newState)
    }
  }

  /**
   * Handle pointer up: End drag
   */
  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setDragState(INITIAL_DRAG_STATE)
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-minimap ${dragState.isDragging ? "dragging" : ""} ${className}`}
      style={{
        width: MINIMAP_MAX_WIDTH,
        height: MINIMAP_MAX_HEIGHT,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* SVG thumbnail - union-based positioning */}
      <div
        className='mermaid-minimap-content'
        style={{
          position: "absolute",
          left: layout.svgRect.x,
          top: layout.svgRect.y,
          width: layout.svgRect.width,
          height: layout.svgRect.height,
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG content from mermaid
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {/* Viewport indicator - union-based positioning */}
      <div
        className='mermaid-minimap-viewport'
        style={{
          left: layout.viewportRect.x,
          top: layout.viewportRect.y,
          width: layout.viewportRect.width,
          height: layout.viewportRect.height,
        }}
      />
    </div>
  )
}
