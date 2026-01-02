import mermaid from "mermaid"
import { useEffect, useRef } from "react"
import { DEFAULT_ZOOM_CONSTRAINTS, toTransformCSS } from "../core/transform"
import { parseSvgDimensions } from "../core/viewport"
import { useMermaidStore } from "../store/useMermaidStore"
import type { MermaidViewerProps, SvgDimensions } from "../types"
import { FullscreenOverlay } from "./FullscreenOverlay"
import { Minimap } from "./Minimap"
import { ZoomControls } from "./ZoomControls"

/**
 * Normalize SVG to have explicit width/height matching viewBox dimensions
 *
 * Mermaid generates SVGs with width="100%" which causes the SVG to render
 * at container size instead of its natural dimensions. This function sets
 * explicit pixel dimensions matching the viewBox for predictable sizing.
 */
function normalizeSvgDimensions(svgHtml: string, dims: SvgDimensions): string {
  let result = svgHtml

  // Replace or add width attribute
  if (/(<svg[^>]*)\s+width="[^"]*"/.test(result)) {
    result = result.replace(/(<svg[^>]*)\s+width="[^"]*"/, `$1 width="${dims.width}"`)
  } else {
    result = result.replace(/<svg/, `<svg width="${dims.width}"`)
  }

  // Replace or add height attribute
  if (/(<svg[^>]*)\s+height="[^"]*"/.test(result)) {
    result = result.replace(/(<svg[^>]*)\s+height="[^"]*"/, `$1 height="${dims.height}"`)
  } else {
    result = result.replace(/<svg/, `<svg height="${dims.height}"`)
  }

  return result
}

// Track mermaid initialization
let mermaidInitialized = false

function initMermaid() {
  if (mermaidInitialized) return

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "default",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    suppressErrorRendering: true,
  })

  mermaidInitialized = true
}

// Counter for unique IDs
let idCounter = 0

/**
 * Mermaid diagram viewer with pan-zoom and minimap support
 *
 * Renders mermaid diagrams and provides fullscreen mode with:
 * - Mouse drag panning
 * - Mouse wheel zooming
 * - Minimap navigation
 * - Zoom controls
 *
 * Requires a MermaidStore instance for state management.
 * Create with MermaidStore.create() at the parent component level.
 */
export function MermaidViewer({
  definition,
  id,
  className = "",
  showControls = true,
  showMinimap = true,
  interactive = true,
  onFullscreenChange,
  zoomConstraints = DEFAULT_ZOOM_CONSTRAINTS,
  store,
}: MermaidViewerProps) {
  // Refs
  const contentRef = useRef<HTMLDivElement>(null)

  // Subscribe to store
  const snapshot = useMermaidStore(store)

  // Generate unique ID
  const diagramId = useRef(id ?? `mermaid-viewer-${++idCounter}`).current

  // Render mermaid diagram
  useEffect(() => {
    if (!definition.trim()) {
      store.resetRenderState()
      return
    }

    let cancelled = false
    store.setLoading()

    initMermaid()

    mermaid
      .render(diagramId, definition)
      .then(({ svg }) => {
        if (cancelled) return

        // Parse SVG dimensions from viewBox
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = svg
        const svgEl = tempDiv.querySelector("svg")
        if (svgEl) {
          const dims = parseSvgDimensions(svgEl)
          // Normalize SVG to have explicit width/height matching viewBox
          // This ensures the SVG renders at its natural size, not container size
          const normalizedSvg = normalizeSvgDimensions(svg, dims)
          store.setSuccess(normalizedSvg, dims)
        } else {
          // Fallback: use svg as-is with default dimensions
          store.setSuccess(svg, { width: 800, height: 600, minX: 0, minY: 0 })
        }
      })
      .catch((err) => {
        if (cancelled) return
        store.setError(err instanceof Error ? err.message : "Failed to render diagram")
      })

    return () => {
      cancelled = true
    }
  }, [definition, diagramId, store])

  // Initialize transform when entering fullscreen
  useEffect(() => {
    if (!snapshot.isFullscreen || !snapshot.svgDimensions || !contentRef.current) return

    const viewportWidth = contentRef.current.clientWidth
    const viewportHeight = contentRef.current.clientHeight

    store.updateViewportSize(viewportWidth, viewportHeight)
    store.initializePanZoomForFullscreen()
  }, [snapshot.isFullscreen, snapshot.svgDimensions, store])

  // Track viewport size with ResizeObserver
  useEffect(() => {
    if (!snapshot.isFullscreen || !contentRef.current) return

    const updateSize = () => {
      if (contentRef.current) {
        store.updateViewportSize(contentRef.current.clientWidth, contentRef.current.clientHeight)
      }
    }

    // Initial size update
    updateSize()

    // Track size changes
    const observer = new ResizeObserver(updateSize)
    observer.observe(contentRef.current)

    return () => observer.disconnect()
  }, [snapshot.isFullscreen, store])

  // Notify parent of fullscreen changes
  useEffect(() => {
    onFullscreenChange?.(snapshot.isFullscreen)
  }, [snapshot.isFullscreen, onFullscreenChange])

  // Open fullscreen
  function openFullscreen() {
    store.openFullscreen()
  }

  // Close fullscreen
  function closeFullscreen() {
    store.closeFullscreen()
  }

  // Zoom handlers
  function handleZoomIn() {
    if (!contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    store.zoomIn(rect.width / 2, rect.height / 2, zoomConstraints)
  }

  function handleZoomOut() {
    if (!contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    store.zoomOut(rect.width / 2, rect.height / 2, zoomConstraints)
  }

  function handleZoomReset() {
    store.resetZoom()
  }

  // Mouse wheel zoom
  function handleWheel(event: React.WheelEvent) {
    event.preventDefault()
    if (!contentRef.current) return

    const rect = contentRef.current.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const factor = event.deltaY > 0 ? 0.9 : 1.1

    store.zoomByFactor(factor, mouseX, mouseY, zoomConstraints)
  }

  // Mouse drag pan
  function handleMouseDown(event: React.MouseEvent) {
    if (event.button !== 0) return // Left click only
    store.startPan(event.clientX, event.clientY)
  }

  function handleMouseMove(event: React.MouseEvent) {
    store.updatePan(event.clientX, event.clientY)
  }

  function handleMouseUp() {
    store.endPan()
  }

  function handleMouseLeave() {
    store.endPan()
  }

  // Loading state
  if (snapshot.isLoading) {
    return (
      <div className={`mermaid-viewer mermaid-viewer-loading ${className}`}>
        <div className='mermaid-spinner' />
        <span>Rendering diagram...</span>
      </div>
    )
  }

  // Error state
  if (snapshot.isError) {
    return (
      <div className={`mermaid-viewer mermaid-viewer-error ${className}`}>
        <div className='mermaid-error-title'>Failed to render diagram</div>
        <pre className='mermaid-error-details'>{snapshot.errorMessage}</pre>
      </div>
    )
  }

  // Empty/idle state
  if (!snapshot.svgContent) {
    return null
  }

  const { svgContent, svgDimensions, transformState, isPanning } = snapshot
  const viewportSize = snapshot.panZoom.viewportSize

  // Non-interactive mode: render static diagram without fullscreen capability
  if (!interactive) {
    return (
      <div className={`mermaid-viewer mermaid-viewer-static ${className}`}>
        <div
          className='mermaid-viewer-preview'
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid SVG output
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    )
  }

  return (
    <>
      {/* Thumbnail container - click to open fullscreen */}
      <button
        type='button'
        className={`mermaid-viewer ${className}`}
        onClick={openFullscreen}
        aria-label='Click to view diagram in fullscreen'
        title='Click to view fullscreen'
      >
        <div
          className='mermaid-viewer-preview'
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid SVG output
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </button>

      {/* Fullscreen overlay */}
      <FullscreenOverlay isOpen={snapshot.isFullscreen} onClose={closeFullscreen}>
        <div
          ref={contentRef}
          role='application'
          aria-label='Pan and zoom diagram area'
          className={`mermaid-fullscreen-content ${isPanning ? "panning" : ""}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className='mermaid-fullscreen-wrapper'
            style={{ transform: toTransformCSS(transformState) }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid SVG output
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>

        {showControls && (
          <ZoomControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            currentZoom={transformState.zoom}
          />
        )}

        {showMinimap && svgContent && svgDimensions && (
          <Minimap
            svgContent={svgContent}
            contentWidth={svgDimensions.width}
            contentHeight={svgDimensions.height}
            contentOriginX={svgDimensions.minX}
            contentOriginY={svgDimensions.minY}
            transformState={transformState}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
            onNavigate={(state) => store.setTransform(state)}
          />
        )}
      </FullscreenOverlay>
    </>
  )
}
