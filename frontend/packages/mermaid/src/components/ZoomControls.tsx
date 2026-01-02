import { Minus, Plus, RotateCcw } from "lucide-react"
import type { ZoomControlsProps } from "../types"

/**
 * Zoom control buttons for pan-zoom viewer
 */
export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onZoomReset,
  currentZoom,
  className = "",
}: ZoomControlsProps) {
  const zoomPercentage = Math.round(currentZoom * 100)

  return (
    <div className={`mermaid-zoom-controls ${className}`}>
      <button
        type='button'
        onClick={onZoomOut}
        className='mermaid-zoom-btn'
        aria-label='Zoom out'
        title='Zoom out'
      >
        <Minus size={16} />
      </button>

      <span className='mermaid-zoom-info' aria-live='polite'>
        {zoomPercentage}%
      </span>

      <button
        type='button'
        onClick={onZoomIn}
        className='mermaid-zoom-btn'
        aria-label='Zoom in'
        title='Zoom in'
      >
        <Plus size={16} />
      </button>

      <button
        type='button'
        onClick={onZoomReset}
        className='mermaid-zoom-btn'
        aria-label='Reset zoom'
        title='Reset zoom'
      >
        <RotateCcw size={16} />
      </button>
    </div>
  )
}
