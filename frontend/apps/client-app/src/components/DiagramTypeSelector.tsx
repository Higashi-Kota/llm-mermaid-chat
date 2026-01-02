import type { DiagramType } from "@mermaid-chat/types"

type DiagramTypeHint = DiagramType | "auto"

const DIAGRAM_TYPES: { value: DiagramTypeHint; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "flowchart", label: "フローチャート" },
  { value: "sequence", label: "シーケンス" },
  { value: "gantt", label: "ガント" },
  { value: "class", label: "クラス" },
  { value: "er", label: "ER" },
  { value: "state", label: "ステート" },
  { value: "journey", label: "ジャーニー" },
]

interface DiagramTypeSelectorProps {
  value: DiagramTypeHint
  onChange: (value: DiagramTypeHint) => void
  disabled?: boolean
}

export function DiagramTypeSelector({ value, onChange, disabled }: DiagramTypeSelectorProps) {
  return (
    <div className='flex flex-wrap gap-1.5'>
      {DIAGRAM_TYPES.map((type) => (
        <button
          key={type.value}
          type='button'
          disabled={disabled}
          onClick={() => onChange(type.value)}
          className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
            value === type.value
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-gray-300 bg-white text-gray-600 hover:border-blue-400"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}

export type { DiagramTypeHint }
