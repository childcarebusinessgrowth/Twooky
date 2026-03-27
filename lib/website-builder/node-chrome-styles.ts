import type { CSSProperties } from "react"
import type { CanvasNodeProps } from "./types"

export type ResolvedSides = { top: number; right: number; bottom: number; left: number }

function hasPerSidePadding(p: CanvasNodeProps): boolean {
  return (
    p.paddingTop !== undefined ||
    p.paddingRight !== undefined ||
    p.paddingBottom !== undefined ||
    p.paddingLeft !== undefined
  )
}

function hasPerSideMargin(p: CanvasNodeProps): boolean {
  return (
    p.marginTop !== undefined ||
    p.marginRight !== undefined ||
    p.marginBottom !== undefined ||
    p.marginLeft !== undefined
  )
}

/**
 * Resolves per-side padding. Legacy `padding` applies to all sides when no per-side keys are set.
 * Optional `allSidesFallback` when nothing is set (e.g. contact form default 12).
 */
export function resolvePaddingSides(
  p: CanvasNodeProps,
  opts?: { allSidesFallback?: number },
): ResolvedSides {
  if (hasPerSidePadding(p)) {
    return {
      top: p.paddingTop ?? 0,
      right: p.paddingRight ?? 0,
      bottom: p.paddingBottom ?? 0,
      left: p.paddingLeft ?? 0,
    }
  }
  if (typeof p.padding === "number" && !Number.isNaN(p.padding)) {
    const v = p.padding
    return { top: v, right: v, bottom: v, left: v }
  }
  if (opts?.allSidesFallback !== undefined) {
    const v = opts.allSidesFallback
    return { top: v, right: v, bottom: v, left: v }
  }
  return { top: 0, right: 0, bottom: 0, left: 0 }
}

export function resolveMarginSides(p: CanvasNodeProps): ResolvedSides {
  if (hasPerSideMargin(p)) {
    return {
      top: p.marginTop ?? 0,
      right: p.marginRight ?? 0,
      bottom: p.marginBottom ?? 0,
      left: p.marginLeft ?? 0,
    }
  }
  return { top: 0, right: 0, bottom: 0, left: 0 }
}

/** Margin on the outer positioned box (px). */
export function outerMarginStyle(p: CanvasNodeProps): Pick<
  CSSProperties,
  "marginTop" | "marginRight" | "marginBottom" | "marginLeft"
> {
  const m = resolveMarginSides(p)
  return {
    marginTop: m.top,
    marginRight: m.right,
    marginBottom: m.bottom,
    marginLeft: m.left,
  }
}

const DEFAULT_BORDER_COLOR = "#cbd5e1"

export function innerBoxStyle(
  p: CanvasNodeProps,
  paddingOpts?: {
    allSidesFallback?: number
    /** When set, use this horizontal inset if `paddingLeft` / `paddingRight` are unset (navbar). */
    navbarHorizontalDefaultPx?: number
    /** When set, use this vertical inset if `paddingTop` / `paddingBottom` are unset (navbar). */
    navbarVerticalDefaultPx?: number
  },
): CSSProperties {
  let pad = resolvePaddingSides(p, paddingOpts)
  if (paddingOpts?.navbarHorizontalDefaultPx !== undefined) {
    if (p.paddingLeft === undefined) pad = { ...pad, left: paddingOpts.navbarHorizontalDefaultPx }
    if (p.paddingRight === undefined) pad = { ...pad, right: paddingOpts.navbarHorizontalDefaultPx }
  }
  if (paddingOpts?.navbarVerticalDefaultPx !== undefined) {
    if (p.paddingTop === undefined) pad = { ...pad, top: paddingOpts.navbarVerticalDefaultPx }
    if (p.paddingBottom === undefined) pad = { ...pad, bottom: paddingOpts.navbarVerticalDefaultPx }
  }
  const w = typeof p.borderWidth === "number" ? p.borderWidth : 0
  const style = p.borderStyle ?? "solid"
  const showBorder = w > 0 && style !== "none"
  const radius = typeof p.borderRadius === "number" ? p.borderRadius : undefined

  const base: CSSProperties = {
    boxSizing: "border-box",
    width: "100%",
    height: "100%",
    minHeight: 0,
    paddingTop: pad.top,
    paddingRight: pad.right,
    paddingBottom: pad.bottom,
    paddingLeft: pad.left,
    borderRadius: radius,
  }

  if (showBorder) {
    return {
      ...base,
      borderStyle: style,
      borderWidth: w,
      borderColor: p.borderColor ?? DEFAULT_BORDER_COLOR,
    }
  }

  return base
}

/** Navbar / gallery gap in px; default when unset. */
export function resolveGapPx(p: CanvasNodeProps, defaultPx: number): number {
  if (typeof p.gap === "number" && !Number.isNaN(p.gap)) return p.gap
  return defaultPx
}

/** Bottom margin for artboard height heuristic (px). */
export function marginBottomForLayout(p: CanvasNodeProps): number {
  return resolveMarginSides(p).bottom
}
