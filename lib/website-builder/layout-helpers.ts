import type { CanvasNode, LayoutByBreakpoint, LayoutRect, WebsiteBuilderBreakpoint } from "./types"

const TABLET_SCALE = 0.64
export const MOBILE_W = 366
export const MOBILE_X = 12

/** Vertical gap between stacked nodes on mobile */
const MOBILE_STACK_GAP = 16
/** Gap after navbar before first cluster */
const MOBILE_NAV_GAP = 16
/** Gap between clusters */
const MOBILE_CLUSTER_GAP = 28
/** Gap before footer */
const MOBILE_FOOTER_GAP = 20

/** Default artboard sizes (CSS px) */
export const ARTBOARD: Record<WebsiteBuilderBreakpoint, { w: number; h: number }> = {
  desktop: { w: 1200, h: 1600 },
  tablet: { w: 768, h: 1400 },
  mobile: { w: 390, h: 1200 },
}

/** Matches editor canvas logic: preferred breakpoint rect, then desktop, then fallbacks. */
export function pickLayoutForBreakpoint(node: CanvasNode, bp: WebsiteBuilderBreakpoint): LayoutRect {
  return (
    node.layout[bp] ??
    node.layout.desktop ??
    node.layout.tablet ??
    node.layout.mobile ?? { x: 0, y: 0, w: 100, h: 40 }
  )
}

export function layoutTriple(
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: { tabletScale?: number; mobileW?: number; mobileX?: number },
): LayoutByBreakpoint {
  const ts = opts?.tabletScale ?? TABLET_SCALE
  const mw = opts?.mobileW ?? MOBILE_W
  const mx = opts?.mobileX ?? MOBILE_X
  return {
    desktop: { x, y, w, h },
    tablet: { x: Math.round(x * ts), y, w: Math.round(w * ts), h },
    mobile: { x: mx, y, w: mw, h },
  }
}

export function ensureLayoutForBreakpoint(
  layout: LayoutByBreakpoint,
  bp: WebsiteBuilderBreakpoint,
): LayoutByBreakpoint {
  if (layout[bp]) return layout
  if (layout.desktop) {
    if (bp === "tablet") {
      return {
        ...layout,
        tablet: {
          x: Math.round(layout.desktop.x * TABLET_SCALE),
          y: layout.desktop.y,
          w: Math.round(layout.desktop.w * TABLET_SCALE),
          h: layout.desktop.h,
        },
      }
    }
    return {
      ...layout,
      mobile: {
        x: MOBILE_X,
        y: layout.desktop.y,
        w: MOBILE_W,
        h: layout.desktop.h,
      },
    }
  }
  return layout
}

function desktopRect(node: CanvasNode): LayoutRect {
  return pickLayoutForBreakpoint(node, "desktop")
}

function estimatedMobileTextHeight(node: CanvasNode): number {
  const raw = typeof node.props.text === "string" ? node.props.text : ""
  const text = raw.trim()
  const fs =
    typeof node.props.fontSize === "number" && Number.isFinite(node.props.fontSize)
      ? node.props.fontSize
      : 16
  if (!text) return Math.max(32, Math.round(fs * 1.5))

  const availableWidth = MOBILE_W - 24
  const charsPerLine = Math.max(14, Math.floor(availableWidth / Math.max(7.5, fs * 0.56)))
  const visualLines = text.split("\n").reduce((sum, part) => {
    const len = part.trim().length
    return sum + Math.max(1, Math.ceil(len / charsPerLine))
  }, 0)
  const lineHeightPx = fs * 1.35
  const contentHeight = Math.ceil(visualLines * lineHeightPx + 12)
  return Math.max(36, Math.min(520, contentHeight))
}

/** Mobile stack uses a conservative text min-height to avoid oversized empty bands. */
function mobileStackHeight(node: CanvasNode): number {
  const base = desktopRect(node).h
  const p = node.props
  switch (node.type) {
    case "text": {
      const textEstimate = estimatedMobileTextHeight(node)
      const fs =
        typeof p.fontSize === "number" && Number.isFinite(p.fontSize) ? p.fontSize : 16
      const cap = fs >= 32 ? Math.min(base, 220) : fs >= 24 ? Math.min(base, 160) : fs >= 20 ? Math.min(base, 124) : Math.min(base, 104)
      const minH =
        fs >= 32 ? Math.max(52, Math.round(fs * 1.35)) : fs >= 24 ? Math.max(40, Math.round(fs * 1.25)) : fs >= 20 ? Math.max(34, 28) : 28
      const adaptive = Math.max(minH, textEstimate)
      return Math.max(adaptive, Math.min(cap, base))
    }
    case "button":
      return Math.max(24, Math.min(base, 56))
    case "image":
      return Math.max(180, Math.min(base, 340))
    case "video":
      return Math.max(210, Math.min(base, 290))
    case "gallery":
      return Math.max(210, Math.min(base, 360))
    case "contactForm":
      return Math.max(380, Math.min(base, 620))
    case "footer":
      return Math.max(76, Math.min(base, 160))
    default:
      return Math.max(24, base)
  }
}

function yIntervalsOverlap(a: LayoutRect, b: LayoutRect): boolean {
  const a0 = a.y
  const a1 = a.y + a.h
  const b0 = b.y
  const b1 = b.y + b.h
  return a0 < b1 && b0 < a1
}

/** Group nodes whose desktop layouts overlap on the Y axis (same “row” / hero band). */
function clusterNodesByVerticalOverlap(nodes: CanvasNode[]): CanvasNode[][] {
  if (nodes.length === 0) return []
  const n = nodes.length
  const rects = nodes.map((node) => desktopRect(node))
  const parent = Array.from({ length: n }, (_, i) => i)

  function find(i: number): number {
    if (parent[i] !== i) parent[i] = find(parent[i])
    return parent[i]
  }

  function union(i: number, j: number) {
    const ri = find(i)
    const rj = find(j)
    if (ri !== rj) parent[ri] = rj
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (yIntervalsOverlap(rects[i], rects[j])) union(i, j)
    }
  }

  const roots = new Map<number, CanvasNode[]>()
  for (let i = 0; i < n; i++) {
    const r = find(i)
    if (!roots.has(r)) roots.set(r, [])
    roots.get(r)!.push(nodes[i])
  }

  const clusters = [...roots.values()]
  clusters.sort((ca, cb) => {
    const minA = Math.min(...ca.map((x) => desktopRect(x).y))
    const minB = Math.min(...cb.map((x) => desktopRect(x).y))
    return minA - minB
  })
  return clusters
}

/**
 * Computes non-overlapping mobile rects by stacking desktop “rows” vertically.
 * Navbar is pinned to the top; footer to the bottom of the stacked content.
 * Section nodes in a cluster share one full-bleed background height behind stacked siblings.
 */
export function resolveMobileLayoutMap(nodes: CanvasNode[]): Map<string, LayoutRect> {
  const out = new Map<string, LayoutRect>()
  const mobileW = ARTBOARD.mobile.w

  const nav = nodes.filter((n) => n.type === "navbar")
  const foot = nodes.filter((n) => n.type === "footer")
  const middle = nodes.filter((n) => n.type !== "navbar" && n.type !== "footer")

  let cursorY = 0

  if (nav.length > 0) {
    const primaryNav = nav[0]
    const r = desktopRect(primaryNav)
    out.set(primaryNav.id, { x: MOBILE_X, y: 0, w: MOBILE_W, h: r.h })
    cursorY = r.h + MOBILE_NAV_GAP
    for (let i = 1; i < nav.length; i++) {
      const extra = nav[i]
      const er = desktopRect(extra)
      out.set(extra.id, { x: MOBILE_X, y: cursorY, w: MOBILE_W, h: er.h })
      cursorY += er.h + MOBILE_STACK_GAP
    }
  }

  const clusters = clusterNodesByVerticalOverlap(middle)

  clusters.forEach((cluster, clusterIndex) => {
    const sections = cluster.filter((n) => n.type === "section")
    const content = cluster.filter((n) => n.type !== "section")
    content.sort((a, b) => {
      const ra = desktopRect(a)
      const rb = desktopRect(b)
      if (ra.y !== rb.y) return ra.y - rb.y
      return ra.x - rb.x
    })

    let stackHeight = 0
    if (content.length > 0) {
      stackHeight = content.reduce((sum, n) => sum + mobileStackHeight(n), 0) + MOBILE_STACK_GAP * (content.length - 1)
    } else if (sections.length > 0) {
      stackHeight = Math.max(...sections.map((n) => desktopRect(n).h))
    }

    const clusterTop = cursorY

    for (const s of sections) {
      const sr = desktopRect(s)
      out.set(s.id, {
        x: 0,
        y: clusterTop,
        w: mobileW,
        h: content.length > 0 ? stackHeight : sr.h,
      })
    }

    let innerY = clusterTop
    for (const c of content) {
      const contentH = mobileStackHeight(c)
      out.set(c.id, { x: MOBILE_X, y: innerY, w: MOBILE_W, h: contentH })
      innerY += contentH + MOBILE_STACK_GAP
    }

    const clusterAdvance = stackHeight + (clusterIndex < clusters.length - 1 ? MOBILE_CLUSTER_GAP : 0)
    cursorY = clusterTop + clusterAdvance
  })

  if (foot.length > 0) {
    cursorY += MOBILE_FOOTER_GAP
    for (let i = 0; i < foot.length; i++) {
      const f = foot[i]
      const fr = desktopRect(f)
      out.set(f.id, { x: MOBILE_X, y: cursorY, w: MOBILE_W, h: fr.h })
      cursorY += fr.h + (i < foot.length - 1 ? MOBILE_STACK_GAP : 0)
    }
  }

  for (const n of nodes) {
    if (!out.has(n.id)) {
      const h = mobileStackHeight(n)
      out.set(n.id, { x: MOBILE_X, y: cursorY, w: MOBILE_W, h })
      cursorY += h + MOBILE_STACK_GAP
    }
  }

  return out
}

export function pickLayoutWithMobileResolver(
  node: CanvasNode,
  bp: WebsiteBuilderBreakpoint,
  mobileMap: Map<string, LayoutRect> | null,
): LayoutRect {
  if (bp === "mobile" && mobileMap?.has(node.id)) {
    return mobileMap.get(node.id)!
  }
  return pickLayoutForBreakpoint(node, bp)
}

/** Editor / tall mobile pages: artboard height from stacked mobile layout */
export function resolveMobileArtboardHeight(nodes: CanvasNode[]): number {
  const map = resolveMobileLayoutMap(nodes)
  let bottom = 400
  for (const n of nodes) {
    const r = map.get(n.id)
    if (!r) continue
    bottom = Math.max(bottom, r.y + r.h + 24)
  }
  return Math.min(Math.max(bottom, 600), 12000)
}
