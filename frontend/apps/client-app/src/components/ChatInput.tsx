import { useChatSubmit } from "@mermaid-chat/chat"
import { Loader2, Send } from "lucide-react"
import { useState } from "react"

import { type DiagramTypeHint, DiagramTypeSelector } from "./DiagramTypeSelector"

type ChatInputProps = {
  onSubmit: (message: string, diagramTypeHint: DiagramTypeHint) => void
  isDisabled?: boolean
}

export function ChatInput({ onSubmit, isDisabled }: ChatInputProps) {
  const [diagramTypeHint, setDiagramTypeHint] = useState<DiagramTypeHint>("auto")

  const { getTextareaProps, shortcutHintLabels, triggerSubmit } = useChatSubmit({
    onSubmit: (value, { target }) => {
      if (value.trim()) {
        onSubmit(value.trim(), diagramTypeHint)
        target.value = ""
        setDiagramTypeHint("auto") // Reset after submit
      }
    },
    mode: "mod-enter",
    enabled: !isDisabled,
  })

  return (
    <div className='border-t border-gray-200 bg-white p-4'>
      <div className='mb-3'>
        <span className='mb-1 block text-xs text-gray-500'>図種 (オプション)</span>
        <DiagramTypeSelector
          value={diagramTypeHint}
          onChange={setDiagramTypeHint}
          disabled={isDisabled}
        />
      </div>
      <div className='flex gap-3'>
        <textarea
          {...getTextareaProps({
            className:
              "flex-1 resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500",
            placeholder: "図にしたい内容を入力してください...",
            rows: 3,
            disabled: isDisabled,
          })}
        />
        <button
          type='button'
          onClick={triggerSubmit}
          disabled={isDisabled}
          className='self-end rounded-lg bg-blue-500 p-3 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300'
        >
          {isDisabled ? <Loader2 size={20} className='animate-spin' /> : <Send size={20} />}
        </button>
      </div>
      {shortcutHintLabels && (
        <p className='mt-2 text-xs text-gray-500'>
          {shortcutHintLabels.submit.keys.join(" + ")} で送信
        </p>
      )}
    </div>
  )
}
