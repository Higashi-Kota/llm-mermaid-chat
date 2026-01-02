import type { SvgDimensions, TransformState, ZoomConstraints } from "../types"
import { createInitialTransform, DEFAULT_ZOOM_CONSTRAINTS, zoomAtPoint } from "./transform"

/**
 * Pan/Zoom state managed by PanZoomManager
 */
interface PanZoomState {
  readonly transform: TransformState
  readonly isPanning: boolean
  readonly panStart: { readonly x: number; readonly y: number }
  readonly viewportSize: { readonly width: number; readonly height: number }
  readonly initialTransform: TransformState | null
}

const EMPTY_STATE: PanZoomState = {
  transform: { zoom: 1, panX: 0, panY: 0 },
  isPanning: false,
  panStart: { x: 0, y: 0 },
  viewportSize: { width: 0, height: 0 },
  initialTransform: null,
}

/**
 * PanZoomManager - イミュータブルなパン・ズーム状態管理クラス
 *
 * マウスドラッグによるパン、マウスホイールによるズーム、
 * ズームコントロールボタンによる操作をサポート。
 *
 * 全てのメソッドは新しいインスタンスを返し、元のインスタンスは変更しない。
 */
export class PanZoomManager {
  private constructor(private readonly _state: PanZoomState) {}

  /**
   * 空の状態を作成
   */
  static empty(): PanZoomManager {
    return new PanZoomManager(EMPTY_STATE)
  }

  /**
   * SVG寸法とビューポートサイズから初期状態を作成
   * コンテンツをビューポートにフィットさせて中央配置
   */
  static initial(
    svgDims: SvgDimensions,
    viewportWidth: number,
    viewportHeight: number,
  ): PanZoomManager {
    const transform = createInitialTransform(
      svgDims.width,
      svgDims.height,
      viewportWidth,
      viewportHeight,
    )
    return new PanZoomManager({
      transform,
      isPanning: false,
      panStart: { x: 0, y: 0 },
      viewportSize: { width: viewportWidth, height: viewportHeight },
      initialTransform: transform,
    })
  }

  // ========================================
  // Getters
  // ========================================

  /**
   * 現在のtransform状態
   */
  get transformState(): TransformState {
    return this._state.transform
  }

  /**
   * パン操作中かどうか
   */
  get isPanning(): boolean {
    return this._state.isPanning
  }

  /**
   * パン開始位置
   */
  get panStart(): { readonly x: number; readonly y: number } {
    return this._state.panStart
  }

  /**
   * ビューポートサイズ
   */
  get viewportSize(): { readonly width: number; readonly height: number } {
    return this._state.viewportSize
  }

  /**
   * 初期transform（リセット用）
   */
  get initialTransform(): TransformState | null {
    return this._state.initialTransform
  }

  /**
   * 現在のズームレベル
   */
  get zoom(): number {
    return this._state.transform.zoom
  }

  /**
   * 現在のパンX座標
   */
  get panX(): number {
    return this._state.transform.panX
  }

  /**
   * 現在のパンY座標
   */
  get panY(): number {
    return this._state.transform.panY
  }

  // ========================================
  // Zoom Operations
  // ========================================

  /**
   * 中心点でズームイン (1.25x)
   */
  zoomIn(
    centerX: number,
    centerY: number,
    constraints: ZoomConstraints = DEFAULT_ZOOM_CONSTRAINTS,
  ): PanZoomManager {
    return this.zoomByFactor(1.25, centerX, centerY, constraints)
  }

  /**
   * 中心点でズームアウト (0.8x)
   */
  zoomOut(
    centerX: number,
    centerY: number,
    constraints: ZoomConstraints = DEFAULT_ZOOM_CONSTRAINTS,
  ): PanZoomManager {
    return this.zoomByFactor(0.8, centerX, centerY, constraints)
  }

  /**
   * 指定ポイントを中心にズーム
   */
  zoomByFactor(
    factor: number,
    pivotX: number,
    pivotY: number,
    constraints: ZoomConstraints = DEFAULT_ZOOM_CONSTRAINTS,
  ): PanZoomManager {
    const newTransform = zoomAtPoint(this._state.transform, factor, pivotX, pivotY, constraints)
    return new PanZoomManager({
      ...this._state,
      transform: newTransform,
    })
  }

  /**
   * ズームをリセット（初期状態に戻す）
   */
  resetZoom(): PanZoomManager {
    if (this._state.initialTransform === null) {
      return this
    }
    return new PanZoomManager({
      ...this._state,
      transform: this._state.initialTransform,
    })
  }

  /**
   * transform状態を直接設定
   */
  setTransform(transform: TransformState): PanZoomManager {
    return new PanZoomManager({
      ...this._state,
      transform,
    })
  }

  // ========================================
  // Pan Operations
  // ========================================

  /**
   * パン開始
   */
  startPan(clientX: number, clientY: number): PanZoomManager {
    return new PanZoomManager({
      ...this._state,
      isPanning: true,
      panStart: {
        x: clientX - this._state.transform.panX,
        y: clientY - this._state.transform.panY,
      },
    })
  }

  /**
   * パン更新（ドラッグ中）
   */
  updatePan(clientX: number, clientY: number): PanZoomManager {
    if (!this._state.isPanning) {
      return this
    }
    return new PanZoomManager({
      ...this._state,
      transform: {
        ...this._state.transform,
        panX: clientX - this._state.panStart.x,
        panY: clientY - this._state.panStart.y,
      },
    })
  }

  /**
   * パン終了
   */
  endPan(): PanZoomManager {
    if (!this._state.isPanning) {
      return this
    }
    return new PanZoomManager({
      ...this._state,
      isPanning: false,
    })
  }

  // ========================================
  // Viewport Operations
  // ========================================

  /**
   * ビューポートサイズを更新
   */
  updateViewportSize(width: number, height: number): PanZoomManager {
    if (this._state.viewportSize.width === width && this._state.viewportSize.height === height) {
      return this
    }
    return new PanZoomManager({
      ...this._state,
      viewportSize: { width, height },
    })
  }

  /**
   * フルスクリーン用に初期化
   * SVG寸法に基づいてtransformを再計算
   */
  initializeForFullscreen(svgDims: SvgDimensions): PanZoomManager {
    const { width, height } = this._state.viewportSize
    if (width <= 0 || height <= 0) {
      return this
    }
    const transform = createInitialTransform(svgDims.width, svgDims.height, width, height)
    return new PanZoomManager({
      ...this._state,
      transform,
      initialTransform: transform,
    })
  }

  // ========================================
  // Comparison
  // ========================================

  /**
   * 別の PanZoomManager と等価かどうかを判定
   * パフォーマンス最適化用: 状態が変わっていなければ notify() を回避できる
   */
  equals(other: PanZoomManager): boolean {
    if (this === other) return true

    const s1 = this._state
    const s2 = other._state

    return (
      s1.transform.zoom === s2.transform.zoom &&
      s1.transform.panX === s2.transform.panX &&
      s1.transform.panY === s2.transform.panY &&
      s1.isPanning === s2.isPanning &&
      s1.panStart.x === s2.panStart.x &&
      s1.panStart.y === s2.panStart.y &&
      s1.viewportSize.width === s2.viewportSize.width &&
      s1.viewportSize.height === s2.viewportSize.height &&
      s1.initialTransform?.zoom === s2.initialTransform?.zoom &&
      s1.initialTransform?.panX === s2.initialTransform?.panX &&
      s1.initialTransform?.panY === s2.initialTransform?.panY
    )
  }
}
