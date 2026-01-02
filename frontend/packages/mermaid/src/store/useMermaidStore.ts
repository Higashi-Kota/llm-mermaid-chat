import { useSyncExternalStore } from "react"
import type { MermaidSnapshot, MermaidStore } from "./MermaidStore"

/**
 * MermaidStoreからスナップショットを取得するhook
 *
 * useSyncExternalStoreを使用してストアの状態を購読し、
 * 状態変更時に自動的に再レンダリングをトリガーする。
 *
 * @param store MermaidStore インスタンス
 * @returns 現在の MermaidSnapshot
 *
 * @example
 * ```tsx
 * function MermaidViewer({ store }: { store: MermaidStore }) {
 *   const snapshot = useMermaidStore(store)
 *
 *   if (snapshot.isLoading) {
 *     return <div>Loading...</div>
 *   }
 *
 *   return <div dangerouslySetInnerHTML={{ __html: snapshot.svgContent }} />
 * }
 * ```
 */
export function useMermaidStore(store: MermaidStore): MermaidSnapshot {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
