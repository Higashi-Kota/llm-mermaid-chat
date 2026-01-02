import type { Message } from "@/stores/chatStore"
import { ChatHistory } from "./ChatHistory"
import { ChatInput } from "./ChatInput"

type ChatPanelProps = {
  messages: readonly Message[]
  onSubmit: (message: string) => void
  isLoading: boolean
}

export function ChatPanel({ messages, onSubmit, isLoading }: ChatPanelProps) {
  return (
    <div className='flex h-full flex-col overflow-hidden bg-white'>
      {/* Header - fixed height */}
      <div className='shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3'>
        <h1 className='text-lg font-semibold text-gray-900'>Mermaid Chat</h1>
        <p className='text-xs text-gray-500'>プロンプトからMermaid図を生成します</p>
      </div>
      {/* Chat history - scrollable, takes remaining space */}
      <div className='min-h-0 flex-1'>
        <ChatHistory messages={messages} />
      </div>
      {/* Input - fixed height */}
      <div className='shrink-0'>
        <ChatInput onSubmit={onSubmit} isDisabled={isLoading} />
      </div>
    </div>
  )
}
