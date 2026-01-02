import { useEffect } from "react"
import { ChatPanel } from "./components/ChatPanel"
import { DiagramPanel } from "./components/DiagramPanel"
import { useSSEStream } from "./hooks/useSSEStream"
import { chatStore, useChatStore } from "./stores/chatStore"

// API URL: empty for same-origin (Docker Compose), or explicit URL (Render)
const apiUrl = import.meta.env.VITE_API_URL ?? ""

export function App() {
  const { messages, currentDiagram } = useChatStore()
  const { isStreaming, mermaidCode, error, startStream } = useSSEStream(apiUrl)

  // Update store when streaming produces new mermaid code
  useEffect(() => {
    if (mermaidCode && !isStreaming) {
      chatStore.addAssistantMessage("図を生成しました", mermaidCode)
    }
  }, [mermaidCode, isStreaming])

  const handleSubmit = (message: string) => {
    chatStore.addUserMessage(message)
    startStream(message)
  }

  // Show streaming code or current diagram
  const displayCode = isStreaming ? mermaidCode : currentDiagram || mermaidCode

  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Left: Chat Panel */}
      <div className='h-full w-1/2 overflow-hidden border-r border-gray-200'>
        <ChatPanel messages={messages} onSubmit={handleSubmit} isLoading={isStreaming} />
      </div>

      {/* Right: Diagram Panel */}
      <div className='h-full w-1/2 overflow-hidden'>
        <DiagramPanel mermaidCode={displayCode} isLoading={isStreaming} error={error} />
      </div>
    </div>
  )
}
