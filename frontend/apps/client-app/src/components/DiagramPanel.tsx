import type { StructuredError } from "@mermaid-chat/api-client"
import type { MermaidStore } from "@mermaid-chat/mermaid"
import { MermaidViewer } from "@mermaid-chat/mermaid"
import { Loader2 } from "lucide-react"

import type { ConnectionStatus as ConnectionStatusType, StreamMeta } from "../core"

import { ConnectionStatus } from "./ConnectionStatus"
import { ErrorDisplay } from "./ErrorDisplay"

type DiagramPanelProps = {
  mermaidCode: string
  isLoading?: boolean
  error?: StructuredError | null
  connectionStatus?: ConnectionStatusType
  retryCount?: number
  meta?: StreamMeta | null
  onRetry?: () => void
  mermaidStore: MermaidStore
}

export function DiagramPanel({
  mermaidCode,
  isLoading,
  error,
  connectionStatus = "disconnected",
  retryCount = 0,
  meta,
  onRetry,
  mermaidStore,
}: DiagramPanelProps) {
  return (
    <div className='flex h-full flex-col overflow-hidden bg-gray-50'>
      {/* Header - fixed height */}
      <div className='shrink-0 border-b border-gray-200 bg-white px-4 py-3'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='font-semibold text-gray-900'>Diagram Preview</h2>
            <p className='text-xs text-gray-500'>
              {isLoading ? "生成中..." : mermaidCode ? "クリックでフルスクリーン" : ""}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            {meta && !isLoading && !error && (
              <div className='flex gap-2'>
                <span className='rounded bg-blue-100 px-2 py-1 text-xs text-blue-700'>
                  {meta.diagramType}
                </span>
                <span className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-600'>
                  {meta.language}
                </span>
              </div>
            )}
            <ConnectionStatus status={connectionStatus} retryCount={retryCount} />
          </div>
        </div>
      </div>

      {/* Diagram content - takes remaining space */}
      <div className='flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4'>
        {isLoading ? (
          <div className='flex flex-col items-center gap-3 text-gray-400'>
            <Loader2 size={32} className='animate-spin' />
            <p className='text-sm'>図を生成中...</p>
          </div>
        ) : error ? (
          <div className='w-full max-w-md'>
            <ErrorDisplay error={error} onRetry={onRetry} />
          </div>
        ) : mermaidCode ? (
          <div className='h-full w-full overflow-hidden'>
            <MermaidViewer
              definition={mermaidCode}
              store={mermaidStore}
              showControls={true}
              showMinimap={true}
              interactive={true}
            />
          </div>
        ) : (
          <div className='text-center text-gray-400'>
            <p className='text-lg'>No Diagram</p>
            <p className='mt-1 text-sm'>左側のチャットでプロンプトを入力してください</p>
          </div>
        )}
      </div>
    </div>
  )
}
