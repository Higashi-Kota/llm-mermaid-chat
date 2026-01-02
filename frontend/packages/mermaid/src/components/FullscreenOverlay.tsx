import { X } from "lucide-react"
import { useEffect } from "react"
import { createPortal } from "react-dom"
import type { FullscreenOverlayProps } from "../types"

/**
 * Fullscreen overlay for mermaid diagram viewer
 */
export function FullscreenOverlay({ isOpen, onClose, children }: FullscreenOverlayProps) {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (!isOpen) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className='mermaid-fullscreen-overlay'
      role='dialog'
      aria-modal='true'
      aria-label='Mermaid diagram fullscreen view'
    >
      <div className='mermaid-fullscreen-header'>
        <h3 className='mermaid-fullscreen-title'>Mermaid Diagram</h3>
        <button
          type='button'
          onClick={onClose}
          className='mermaid-close-btn'
          aria-label='Close fullscreen (Escape)'
          title='Close (ESC)'
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>,
    document.body,
  )
}
