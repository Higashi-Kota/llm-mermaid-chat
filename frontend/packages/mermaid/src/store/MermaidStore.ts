import { PanZoomManager } from "../core/PanZoomManager"
import { RenderStateManager } from "../core/RenderStateManager"
import type { SvgDimensions, TransformState, ZoomConstraints } from "../types"

/**
 * MermaidStore のスナップショット
 * useSyncExternalStore で使用される不変のスナップショット
 */
export interface MermaidSnapshot {
  readonly renderState: RenderStateManager
  readonly panZoom: PanZoomManager
  readonly isFullscreen: boolean

  // 便利ゲッター（renderStateからの委譲）
  readonly svgContent: string | null
  readonly svgDimensions: SvgDimensions | null
  readonly isLoading: boolean
  readonly isError: boolean
  readonly errorMessage: string | null

  // 便利ゲッター（panZoomからの委譲）
  readonly transformState: TransformState
  readonly isPanning: boolean
  readonly zoom: number
}

/**
 * MermaidStore - 外部ストアとしてのMermaid状態管理
 *
 * useSyncExternalStore と連携し、React コンポーネントに状態を提供する。
 * 状態変更は全て notify() を通じて購読者に通知される。
 *
 * 内部では PanZoomManager と RenderStateManager を使用し、
 * イミュータブルな状態管理を実現。
 */
export class MermaidStore {
  // === Immutable Managers ===
  private _renderState: RenderStateManager
  private _panZoom: PanZoomManager

  // === UI State ===
  private _isFullscreen = false

  // === Subscription ===
  private readonly _listeners = new Set<() => void>()

  // === Snapshot Cache ===
  private _snapshot: MermaidSnapshot | null = null

  private constructor() {
    this._renderState = RenderStateManager.idle()
    this._panZoom = PanZoomManager.empty()
  }

  /**
   * ファクトリメソッド
   */
  static create(): MermaidStore {
    return new MermaidStore()
  }

  // ==========================================
  // useSyncExternalStore API
  // ==========================================

  /**
   * 購読（useSyncExternalStore の subscribe 引数）
   */
  subscribe = (listener: () => void): (() => void) => {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  /**
   * スナップショット取得（useSyncExternalStore の getSnapshot 引数）
   * 状態が変わっていなければ同じ参照を返す
   */
  getSnapshot = (): MermaidSnapshot => {
    if (this._snapshot === null) {
      this._snapshot = this.createSnapshot()
    }
    return this._snapshot
  }

  /**
   * 状態変更を通知
   */
  private notify(): void {
    this._snapshot = null
    for (const listener of this._listeners) {
      listener()
    }
  }

  /**
   * スナップショット生成
   */
  private createSnapshot(): MermaidSnapshot {
    return {
      renderState: this._renderState,
      panZoom: this._panZoom,
      isFullscreen: this._isFullscreen,

      // RenderStateから委譲
      svgContent: this._renderState.svgContent,
      svgDimensions: this._renderState.svgDimensions,
      isLoading: this._renderState.isLoading,
      isError: this._renderState.isError,
      errorMessage: this._renderState.errorMessage,

      // PanZoomから委譲
      transformState: this._panZoom.transformState,
      isPanning: this._panZoom.isPanning,
      zoom: this._panZoom.zoom,
    }
  }

  // ==========================================
  // Getters (for Actions)
  // ==========================================

  get renderState(): RenderStateManager {
    return this._renderState
  }

  get panZoom(): PanZoomManager {
    return this._panZoom
  }

  get isFullscreen(): boolean {
    return this._isFullscreen
  }

  // ==========================================
  // Render State Methods
  // ==========================================

  /**
   * ローディング状態に設定
   */
  setLoading(): void {
    this._renderState = RenderStateManager.loading()
    this.notify()
  }

  /**
   * 成功状態に設定
   */
  setSuccess(svgContent: string, svgDimensions: SvgDimensions): void {
    this._renderState = RenderStateManager.success(svgContent, svgDimensions)
    this.notify()
  }

  /**
   * エラー状態に設定
   */
  setError(message: string): void {
    this._renderState = RenderStateManager.error(message)
    this.notify()
  }

  /**
   * idle状態にリセット
   */
  resetRenderState(): void {
    this._renderState = RenderStateManager.idle()
    this.notify()
  }

  // ==========================================
  // Pan/Zoom Methods
  // ==========================================

  /**
   * ズームイン
   */
  zoomIn(centerX: number, centerY: number, constraints?: ZoomConstraints): void {
    this._panZoom = this._panZoom.zoomIn(centerX, centerY, constraints)
    this.notify()
  }

  /**
   * ズームアウト
   */
  zoomOut(centerX: number, centerY: number, constraints?: ZoomConstraints): void {
    this._panZoom = this._panZoom.zoomOut(centerX, centerY, constraints)
    this.notify()
  }

  /**
   * 指定ポイントを中心にズーム
   */
  zoomByFactor(
    factor: number,
    pivotX: number,
    pivotY: number,
    constraints?: ZoomConstraints,
  ): void {
    this._panZoom = this._panZoom.zoomByFactor(factor, pivotX, pivotY, constraints)
    this.notify()
  }

  /**
   * ズームをリセット
   */
  resetZoom(): void {
    this._panZoom = this._panZoom.resetZoom()
    this.notify()
  }

  /**
   * Transform状態を直接設定
   */
  setTransform(transform: TransformState): void {
    this._panZoom = this._panZoom.setTransform(transform)
    this.notify()
  }

  /**
   * パン開始
   */
  startPan(clientX: number, clientY: number): void {
    this._panZoom = this._panZoom.startPan(clientX, clientY)
    this.notify()
  }

  /**
   * パン更新
   */
  updatePan(clientX: number, clientY: number): void {
    const newPanZoom = this._panZoom.updatePan(clientX, clientY)
    if (newPanZoom !== this._panZoom) {
      this._panZoom = newPanZoom
      this.notify()
    }
  }

  /**
   * パン終了
   */
  endPan(): void {
    const newPanZoom = this._panZoom.endPan()
    if (newPanZoom !== this._panZoom) {
      this._panZoom = newPanZoom
      this.notify()
    }
  }

  /**
   * ビューポートサイズを更新
   */
  updateViewportSize(width: number, height: number): void {
    const newPanZoom = this._panZoom.updateViewportSize(width, height)
    if (newPanZoom !== this._panZoom) {
      this._panZoom = newPanZoom
      this.notify()
    }
  }

  /**
   * フルスクリーン用にPanZoomを初期化
   */
  initializePanZoomForFullscreen(): void {
    const dims = this._renderState.svgDimensions
    if (!dims) return

    this._panZoom = this._panZoom.initializeForFullscreen(dims)
    this.notify()
  }

  // ==========================================
  // Fullscreen Methods
  // ==========================================

  /**
   * フルスクリーンを開く
   */
  openFullscreen(): void {
    if (this._isFullscreen) return
    this._isFullscreen = true
    this.notify()
  }

  /**
   * フルスクリーンを閉じる
   */
  closeFullscreen(): void {
    if (!this._isFullscreen) return
    this._isFullscreen = false
    // フルスクリーン終了時にPanZoomをリセット
    this._panZoom = PanZoomManager.empty()
    this.notify()
  }

  /**
   * フルスクリーンをトグル
   */
  toggleFullscreen(): void {
    if (this._isFullscreen) {
      this.closeFullscreen()
    } else {
      this.openFullscreen()
    }
  }

  // ==========================================
  // Combined Operations
  // ==========================================

  /**
   * 全状態をリセット
   */
  reset(): void {
    this._renderState = RenderStateManager.idle()
    this._panZoom = PanZoomManager.empty()
    this._isFullscreen = false
    this.notify()
  }
}
