import { FileCode, Image, Loader2 } from "lucide-react"
import { useState } from "react"

export interface ExportControlsProps {
  onExportSvg: () => void
  onExportPng: () => Promise<void>
  className?: string
}

export function ExportControls({ onExportSvg, onExportPng, className = "" }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPng = async () => {
    setIsExporting(true)
    try {
      await onExportPng()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        type='button'
        onClick={onExportSvg}
        className='flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        aria-label='Download as SVG'
        title='Download SVG'
      >
        <FileCode size={14} />
        <span>SVG</span>
      </button>
      <button
        type='button'
        onClick={handleExportPng}
        disabled={isExporting}
        className='flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        aria-label='Download as PNG'
        title='Download PNG'
      >
        {isExporting ? <Loader2 size={14} className='animate-spin' /> : <Image size={14} />}
        <span>PNG</span>
      </button>
    </div>
  )
}
