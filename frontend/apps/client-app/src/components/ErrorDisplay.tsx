import type { ErrorCategory, StructuredError } from "@mermaid-chat/api-client"
import { AlertCircle, AlertTriangle, RefreshCw, WifiOff, XCircle } from "lucide-react"

type ErrorDisplayProps = {
  error: StructuredError
  onRetry?: () => void
  onDismiss?: () => void
}

// Extended categories to include those not in generated API
type ExtendedCategory = ErrorCategory | "autofix"

const CATEGORY_ICONS: Record<ExtendedCategory, typeof AlertCircle> = {
  network: WifiOff,
  generation: AlertCircle,
  validation: AlertTriangle,
  server: XCircle,
  rate_limit: AlertCircle,
  unknown: AlertCircle,
  autofix: AlertTriangle,
}

const CATEGORY_COLORS: Record<ExtendedCategory, string> = {
  network: "bg-yellow-50 border-yellow-200 text-yellow-800",
  generation: "bg-red-50 border-red-200 text-red-800",
  validation: "bg-orange-50 border-orange-200 text-orange-800",
  server: "bg-red-50 border-red-200 text-red-800",
  rate_limit: "bg-yellow-50 border-yellow-200 text-yellow-800",
  unknown: "bg-gray-50 border-gray-200 text-gray-800",
  autofix: "bg-orange-50 border-orange-200 text-orange-800",
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  const Icon = CATEGORY_ICONS[error.category] || AlertCircle
  const colorClass = CATEGORY_COLORS[error.category] || CATEGORY_COLORS.server

  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <div className='flex items-start gap-3'>
        <Icon size={20} className='mt-0.5 shrink-0' />
        <div className='flex-1'>
          <p className='font-medium'>{error.message}</p>
          {error.details && error.details.length > 0 && (
            <ul className='mt-2 text-sm opacity-80'>
              {error.details.map((detail, i) => (
                <li key={i}>- {detail}</li>
              ))}
            </ul>
          )}
          {error.trace_id && <p className='mt-2 text-xs opacity-60'>Trace ID: {error.trace_id}</p>}
        </div>
      </div>

      <div className='mt-3 flex gap-2'>
        {error.retryable && onRetry && (
          <button
            type='button'
            onClick={onRetry}
            className='flex items-center gap-1.5 rounded-md bg-white/80 px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-white'
          >
            <RefreshCw size={14} />
            再試行
          </button>
        )}
        {onDismiss && (
          <button
            type='button'
            onClick={onDismiss}
            className='rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-white/50'
          >
            閉じる
          </button>
        )}
      </div>
    </div>
  )
}
