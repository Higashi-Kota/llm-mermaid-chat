import { MermaidStore } from "@mermaid-chat/mermaid"

import { ChatPanel } from "./components/ChatPanel"
import { DiagramPanel } from "./components/DiagramPanel"
import type { DiagramTypeHint } from "./components/DiagramTypeSelector"
import { DiagramStore, useDiagramStore } from "./store"
import { chatStore, useChatStore } from "./stores/chatStore"

// API URL: empty for same-origin (Docker Compose), or explicit URL (Render)
const apiUrl = import.meta.env.VITE_API_URL ?? ""

// Create stores at module level with completion callback
const diagramStore = DiagramStore.create(apiUrl, (response) => {
  // Only add message if successful (no errors and has code)
  if (response.mermaid_code && response.errors.length === 0) {
    chatStore.addAssistantMessage("図を生成しました", response.mermaid_code)
  }
})

const mermaidStore = MermaidStore.create()

export function App() {
  const { messages, currentDiagram } = useChatStore()
  const snapshot = useDiagramStore(diagramStore)

  // Inline handler - NO useCallback
  function handleSubmit(message: string, diagramTypeHint: DiagramTypeHint) {
    chatStore.addUserMessage(message)
    diagramStore.startStream(message, diagramTypeHint === "auto" ? null : diagramTypeHint)
  }

  // Show streaming code or current diagram
  const displayCode = snapshot.isStreaming
    ? snapshot.mermaidCode
    : currentDiagram || snapshot.mermaidCode

  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Left: Chat Panel */}
      <div className='h-full w-1/2 overflow-hidden border-r border-gray-200'>
        <ChatPanel messages={messages} onSubmit={handleSubmit} isLoading={snapshot.isStreaming} />
      </div>

      {/* Right: Diagram Panel */}
      <div className='h-full w-1/2 overflow-hidden'>
        <DiagramPanel
          mermaidCode={displayCode}
          isLoading={snapshot.isStreaming}
          error={snapshot.error}
          connectionStatus={snapshot.connectionStatus}
          retryCount={snapshot.retryCount}
          meta={snapshot.meta}
          onRetry={() => diagramStore.retry()}
          mermaidStore={mermaidStore}
        />
      </div>
    </div>
  )
}
