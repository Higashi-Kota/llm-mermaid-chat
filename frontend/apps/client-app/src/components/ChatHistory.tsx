import { Check, Copy } from "lucide-react"
import { useState } from "react"
import type { Message } from "@/stores/chatStore"

type ChatHistoryProps = {
  messages: readonly Message[]
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Ignore clipboard errors
    }
  }

  return (
    <button
      type='button'
      onClick={copyCode}
      className='absolute top-2 right-2 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200'
      title='Copy code'
    >
      {copied ? <Check size={14} className='text-green-400' /> : <Copy size={14} />}
    </button>
  )
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className='flex h-full items-center justify-center p-8 text-center text-gray-400'>
        <div>
          <p className='mb-2 text-lg'>Mermaid Chat</p>
          <p className='text-sm'>
            プロンプトを入力して
            <br />
            Mermaid図を生成しましょう
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='h-full space-y-4 overflow-y-auto p-4'>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-lg p-3 ${
            msg.role === "user" ? "ml-8 bg-blue-50 text-blue-900" : "mr-8 bg-gray-100 text-gray-900"
          }`}
        >
          <p className='text-sm whitespace-pre-wrap'>{msg.content}</p>
          {msg.mermaidCode && (
            <div className='relative mt-2'>
              <pre className='overflow-x-auto rounded bg-gray-800 p-2 pr-10 text-xs text-gray-100'>
                {msg.mermaidCode}
              </pre>
              <CopyButton code={msg.mermaidCode} />
            </div>
          )}
          <p className='mt-1 text-xs text-gray-400'>
            {msg.timestamp.toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      ))}
    </div>
  )
}
