import { useSyncExternalStore } from "react"

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  mermaidCode?: string
  timestamp: Date
}

type ChatSnapshot = {
  messages: readonly Message[]
  currentDiagram: string | null
}

class ChatStore {
  private _messages: Message[] = []
  private _currentDiagram: string | null = null
  private _listeners = new Set<() => void>()
  private _snapshot: ChatSnapshot | null = null

  subscribe = (listener: () => void): (() => void) => {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  getSnapshot = (): ChatSnapshot => {
    if (!this._snapshot) {
      this._snapshot = {
        messages: this._messages,
        currentDiagram: this._currentDiagram,
      }
    }
    return this._snapshot
  }

  private notify(): void {
    this._snapshot = null
    for (const listener of this._listeners) {
      listener()
    }
  }

  addUserMessage(content: string): void {
    this._messages = [
      ...this._messages,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      },
    ]
    this.notify()
  }

  addAssistantMessage(content: string, mermaidCode?: string): void {
    this._messages = [
      ...this._messages,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        mermaidCode,
        timestamp: new Date(),
      },
    ]
    if (mermaidCode) {
      this._currentDiagram = mermaidCode
    }
    this.notify()
  }

  setCurrentDiagram(code: string): void {
    this._currentDiagram = code
    this.notify()
  }

  clearMessages(): void {
    this._messages = []
    this._currentDiagram = null
    this.notify()
  }
}

export const chatStore = new ChatStore()

export function useChatStore(): ChatSnapshot {
  return useSyncExternalStore(chatStore.subscribe, chatStore.getSnapshot)
}
