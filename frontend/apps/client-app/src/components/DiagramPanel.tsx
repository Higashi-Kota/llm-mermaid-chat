import { MermaidStore, MermaidViewer } from "@mermaid-chat/mermaid"
import { Loader2 } from "lucide-react"
import { useMemo } from "react"

type DiagramPanelProps = {
  mermaidCode: string
  isLoading?: boolean
  error?: string | null
}

export function DiagramPanel({ mermaidCode, isLoading, error }: DiagramPanelProps) {
  const store = useMemo(() => MermaidStore.create(), [])

  return (
    <div className='flex h-full flex-col overflow-hidden bg-gray-50'>
      {/* Header - fixed height */}
      <div className='shrink-0 border-b border-gray-200 bg-white px-4 py-3'>
        <div>
          <h2 className='font-semibold text-gray-900'>Diagram Preview</h2>
          <p className='text-xs text-gray-500'>
            {isLoading ? "生成中..." : mermaidCode ? "クリックでフルスクリーン" : ""}
          </p>
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
          <div className='max-w-md rounded-lg bg-red-50 p-4 text-center'>
            <p className='font-medium text-red-700'>エラーが発生しました</p>
            <p className='mt-1 text-sm text-red-600'>{error}</p>
          </div>
        ) : mermaidCode ? (
          <div className='h-full w-full overflow-hidden'>
            <MermaidViewer
              definition={mermaidCode}
              store={store}
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
