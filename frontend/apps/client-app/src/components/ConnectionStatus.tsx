import { Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react"

import type { ConnectionStatus as ConnectionStatusType } from "../core"

type ConnectionStatusProps = {
  status: ConnectionStatusType
  retryCount?: number
}

type StatusConfig = {
  icon: typeof Wifi
  text: string
  className: string
  show: boolean
  animate?: boolean
}

const STATUS_CONFIGS: Record<ConnectionStatusType, StatusConfig> = {
  disconnected: {
    icon: WifiOff,
    text: "",
    className: "text-gray-400",
    show: false,
  },
  connecting: {
    icon: Loader2,
    text: "接続中...",
    className: "text-blue-500",
    show: true,
    animate: true,
  },
  connected: {
    icon: Wifi,
    text: "接続済み",
    className: "text-green-500",
    show: true,
  },
  reconnecting: {
    icon: RefreshCw,
    text: "再接続中...",
    className: "text-yellow-500",
    show: true,
    animate: true,
  },
}

export function ConnectionStatus({ status, retryCount = 0 }: ConnectionStatusProps) {
  const config = STATUS_CONFIGS[status]
  if (!config.show) return null

  const Icon = config.icon
  const text =
    status === "reconnecting" && retryCount > 0 ? `再接続中... (${retryCount}回目)` : config.text

  return (
    <div className={`flex items-center gap-1.5 text-xs ${config.className}`}>
      <Icon size={14} className={config.animate ? "animate-spin" : ""} />
      <span>{text}</span>
    </div>
  )
}
