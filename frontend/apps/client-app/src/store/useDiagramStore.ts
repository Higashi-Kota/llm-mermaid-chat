import { useSyncExternalStore } from "react"
import type { DiagramSnapshot, DiagramStore } from "./DiagramStore"

/**
 * React hook to subscribe to DiagramStore
 *
 * Uses useSyncExternalStore for proper React 18+ concurrent mode support
 */
export function useDiagramStore(store: DiagramStore): DiagramSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
