import { match, P } from "ts-pattern"
import type { SvgDimensions } from "../types"

/**
 * Mermaid rendering status discriminated union
 */
export type RenderStatus =
  | { readonly type: "idle" }
  | { readonly type: "loading" }
  | { readonly type: "success"; readonly svgContent: string; readonly svgDimensions: SvgDimensions }
  | { readonly type: "error"; readonly message: string }

/**
 * RenderStateManager - イミュータブルなレンダリング状態管理クラス
 *
 * Mermaidダイアグラムのレンダリング状態（idle, loading, success, error）を管理。
 * 判別共用体（discriminated union）を使用して型安全に状態を表現。
 *
 * 全てのメソッドは新しいインスタンスを返し、元のインスタンスは変更しない。
 */
export class RenderStateManager {
  private constructor(private readonly _status: RenderStatus) {}

  // ========================================
  // Factory Methods
  // ========================================

  /**
   * 初期状態（idle）を作成
   */
  static idle(): RenderStateManager {
    return new RenderStateManager({ type: "idle" })
  }

  /**
   * ローディング状態を作成
   */
  static loading(): RenderStateManager {
    return new RenderStateManager({ type: "loading" })
  }

  /**
   * 成功状態を作成
   */
  static success(svgContent: string, svgDimensions: SvgDimensions): RenderStateManager {
    return new RenderStateManager({ type: "success", svgContent, svgDimensions })
  }

  /**
   * エラー状態を作成
   */
  static error(message: string): RenderStateManager {
    return new RenderStateManager({ type: "error", message })
  }

  // ========================================
  // State Getters
  // ========================================

  /**
   * 現在の状態タイプ
   */
  get type(): RenderStatus["type"] {
    return this._status.type
  }

  /**
   * 内部の状態オブジェクト（パターンマッチング用）
   */
  get status(): RenderStatus {
    return this._status
  }

  /**
   * idle状態かどうか
   */
  get isIdle(): boolean {
    return this._status.type === "idle"
  }

  /**
   * ローディング中かどうか
   */
  get isLoading(): boolean {
    return this._status.type === "loading"
  }

  /**
   * 成功状態かどうか
   */
  get isSuccess(): boolean {
    return this._status.type === "success"
  }

  /**
   * エラー状態かどうか
   */
  get isError(): boolean {
    return this._status.type === "error"
  }

  // ========================================
  // Data Getters
  // ========================================

  /**
   * SVGコンテンツ（成功時のみ）
   */
  get svgContent(): string | null {
    return match(this._status)
      .with({ type: "success" }, (s) => s.svgContent)
      .otherwise(() => null)
  }

  /**
   * SVG寸法（成功時のみ）
   */
  get svgDimensions(): SvgDimensions | null {
    return match(this._status)
      .with({ type: "success" }, (s) => s.svgDimensions)
      .otherwise(() => null)
  }

  /**
   * エラーメッセージ（エラー時のみ）
   */
  get errorMessage(): string | null {
    return match(this._status)
      .with({ type: "error" }, (s) => s.message)
      .otherwise(() => null)
  }

  // ========================================
  // State Transitions
  // ========================================

  /**
   * ローディング状態に遷移
   */
  toLoading(): RenderStateManager {
    return RenderStateManager.loading()
  }

  /**
   * 成功状態に遷移
   */
  toSuccess(svgContent: string, svgDimensions: SvgDimensions): RenderStateManager {
    return RenderStateManager.success(svgContent, svgDimensions)
  }

  /**
   * エラー状態に遷移
   */
  toError(message: string): RenderStateManager {
    return RenderStateManager.error(message)
  }

  /**
   * idle状態にリセット
   */
  reset(): RenderStateManager {
    return RenderStateManager.idle()
  }

  // ========================================
  // Comparison
  // ========================================

  /**
   * 別の RenderStateManager と等価かどうかを判定
   */
  equals(other: RenderStateManager): boolean {
    if (this === other) return true

    return match([this._status, other._status])
      .with([{ type: "idle" }, { type: "idle" }], () => true)
      .with([{ type: "loading" }, { type: "loading" }], () => true)
      .with(
        [
          { type: "success", svgContent: P.select("c1"), svgDimensions: P.select("d1") },
          { type: "success", svgContent: P.select("c2"), svgDimensions: P.select("d2") },
        ],
        ({ c1, c2, d1, d2 }) =>
          c1 === c2 &&
          d1.width === d2.width &&
          d1.height === d2.height &&
          d1.minX === d2.minX &&
          d1.minY === d2.minY,
      )
      .with(
        [
          { type: "error", message: P.select("m1") },
          { type: "error", message: P.select("m2") },
        ],
        ({ m1, m2 }) => m1 === m2,
      )
      .otherwise(() => false)
  }
}
