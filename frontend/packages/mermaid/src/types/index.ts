/**
 * Pan-zoom transform state
 */
export interface TransformState {
  readonly zoom: number
  readonly panX: number
  readonly panY: number
}

/**
 * Zoom constraints
 */
export interface ZoomConstraints {
  readonly minZoom: number
  readonly maxZoom: number
}

/**
 * Viewport bounds in content coordinates
 */
export interface ViewportBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/**
 * Bounding box representation (min/max format)
 */
export interface BBox {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

/**
 * Union-based minimap layout computed from content and viewport
 */
export interface MinimapLayout {
  /** Scale factor to fit union in minimap */
  readonly scale: number
  /** Union bounding box in content coordinates */
  readonly unionBBox: BBox
  /** SVG thumbnail position/size in minimap coordinates */
  readonly svgRect: ViewportBounds
  /** Viewport indicator position/size in minimap coordinates */
  readonly viewportRect: ViewportBounds
}

/**
 * Minimap dimensions
 */
export interface MinimapDimensions {
  readonly width: number
  readonly height: number
  readonly scale: number
}

/**
 * SVG dimensions with viewBox origin
 */
export interface SvgDimensions {
  readonly width: number
  readonly height: number
  /** ViewBox minX (origin X offset), defaults to 0 */
  readonly minX: number
  /** ViewBox minY (origin Y offset), defaults to 0 */
  readonly minY: number
}

/**
 * MermaidViewer component props
 */
export interface MermaidViewerProps {
  /** Mermaid diagram definition */
  readonly definition: string
  /** Unique ID for the diagram */
  readonly id?: string
  /** Additional CSS class for the container */
  readonly className?: string
  /** Whether to show zoom controls (default: true) */
  readonly showControls?: boolean
  /** Whether to show minimap (default: true) */
  readonly showMinimap?: boolean
  /** Whether clicking opens fullscreen (default: true). Set to false in edit mode. */
  readonly interactive?: boolean
  /** Callback when fullscreen state changes */
  readonly onFullscreenChange?: (isFullscreen: boolean) => void
  /** Zoom constraints */
  readonly zoomConstraints?: ZoomConstraints
  /**
   * MermaidStore instance for state management.
   * Create with MermaidStore.create() at the parent component level.
   */
  readonly store: import("../store/MermaidStore").MermaidStore
}

/**
 * ZoomControls component props
 */
export interface ZoomControlsProps {
  readonly onZoomIn: () => void
  readonly onZoomOut: () => void
  readonly onZoomReset: () => void
  readonly currentZoom: number
  readonly className?: string
}

/**
 * Minimap component props
 */
export interface MinimapProps {
  /** SVG content to display as thumbnail */
  readonly svgContent: string
  /** Content natural width */
  readonly contentWidth: number
  /** Content natural height */
  readonly contentHeight: number
  /** ViewBox origin X (default: 0) */
  readonly contentOriginX?: number
  /** ViewBox origin Y (default: 0) */
  readonly contentOriginY?: number
  /** Additional CSS class */
  readonly className?: string
  /** Current transform state for navigation calculations */
  readonly transformState: TransformState
  /** Viewport width in pixels */
  readonly viewportWidth: number
  /** Viewport height in pixels */
  readonly viewportHeight: number
  /** Callback when user navigates via minimap */
  readonly onNavigate?: (state: TransformState) => void
}

/**
 * Minimap drag state (internal)
 */
export interface MinimapDragState {
  readonly isDragging: boolean
  readonly mode: "none" | "viewport" | "outside"
  readonly startX: number
  readonly startY: number
  readonly startPanX: number
  readonly startPanY: number
}

/**
 * FullscreenOverlay component props
 */
export interface FullscreenOverlayProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly children: React.ReactNode
  /** Handler for SVG export */
  readonly onExportSvg?: () => void
  /** Handler for PNG export */
  readonly onExportPng?: () => Promise<void>
}
