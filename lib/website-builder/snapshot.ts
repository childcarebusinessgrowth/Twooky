import sanitizeHtml from "sanitize-html"
import { isAllowedEmbedUrl } from "./video-embed"
import type { CanvasNode, CanvasNodeProps, PublishedSiteSnapshot, NavItem, ThemeTokens } from "./types"
import { SNAPSHOT_VERSION } from "./types"

const MAX_SPACING_PX = 120
const MAX_GAP_PX = 120
const MAX_BORDER_WIDTH_PX = 24

function clampSpacing(n: unknown): number | undefined {
  if (typeof n !== "number" || Number.isNaN(n)) return undefined
  return Math.round(Math.min(MAX_SPACING_PX, Math.max(0, n)))
}

function sanitizeHexColor(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined
  const t = raw.trim()
  if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(t)) return undefined
  return t.length === 4 ? `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}` : t
}

function sanitizeNodeChromeProps(props: CanvasNodeProps) {
  const marginKeys = ["marginTop", "marginRight", "marginBottom", "marginLeft"] as const
  for (const k of marginKeys) {
    if (props[k] === undefined) continue
    const v = clampSpacing(props[k])
    if (v === undefined) delete props[k]
    else props[k] = v
  }

  const padKeys = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"] as const
  for (const k of padKeys) {
    if (props[k] === undefined) continue
    const v = clampSpacing(props[k])
    if (v === undefined) delete props[k]
    else props[k] = v
  }

  if (props.padding !== undefined) {
    const v = clampSpacing(props.padding)
    if (v === undefined) delete props.padding
    else props.padding = v
  }

  if (props.gap !== undefined) {
    const v = clampSpacing(props.gap)
    if (v === undefined) delete props.gap
    else props.gap = Math.min(v, MAX_GAP_PX)
  }

  const rawBw = props.borderWidth
  if (typeof rawBw !== "number" || Number.isNaN(rawBw)) {
    delete props.borderWidth
    delete props.borderColor
    delete props.borderStyle
  } else {
    const bw = Math.round(Math.min(MAX_BORDER_WIDTH_PX, Math.max(0, rawBw)))
    if (bw <= 0) {
      delete props.borderWidth
      delete props.borderColor
      delete props.borderStyle
    } else {
      props.borderWidth = bw
      const bs = props.borderStyle
      if (bs !== "none" && bs !== "solid" && bs !== "dashed" && bs !== "dotted") {
        delete props.borderStyle
      }
      const col = sanitizeHexColor(props.borderColor)
      if (col) props.borderColor = col
      else delete props.borderColor
    }
  }
}

export { isAllowedEmbedUrl }

/** Internal slug (home = "") or safe external URL for publish */
export function sanitizeNavItemPath(raw: string): string {
  const t = raw.trim()
  if (!t) return ""
  const lower = t.toLowerCase()
  if (lower.startsWith("mailto:")) {
    const m = sanitizePlainText(t, 2000)
    return m.startsWith("mailto:") ? m.slice(0, 2000) : ""
  }
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    try {
      const u = new URL(t)
      if (u.protocol !== "http:" && u.protocol !== "https:") return ""
      return u.href.slice(0, 2000)
    } catch {
      return ""
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return ""
  const slug = sanitizePlainText(t, 120).toLowerCase().replace(/[^a-z0-9-]/g, "")
  return slug.length > 63 ? slug.slice(0, 63) : slug
}

function sanitizeNavItemsForPublish(items: unknown[]): NavItem[] {
  return items.slice(0, 20).map((raw) => {
    const it = raw as Record<string, unknown>
    const label = typeof it?.label === "string" ? sanitizePlainText(it.label, 120) : "Page"
    const path = typeof it?.path === "string" ? sanitizeNavItemPath(it.path) : ""
    let variant = it?.variant
    if (variant !== "link" && variant !== "button") variant = "link"
    const isHttp = path.startsWith("http://") || path.startsWith("https://")
    let openInNewTab = Boolean(it?.openInNewTab) && isHttp
    if (!isHttp) openInNewTab = false
    const id =
      typeof it?.id === "string" ? sanitizePlainText(it.id, 80).replace(/[^a-z0-9-]/gi, "").slice(0, 80) : undefined
    const out: NavItem = { label, path, variant: variant as NavItem["variant"] }
    if (openInNewTab) out.openInNewTab = true
    if (id) out.id = id
    return out
  })
}

export function sanitizePlainText(input: string, maxLen = 8000): string {
  const t = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
  return t.slice(0, maxLen)
}

export function sanitizeCanvasNodesForPublish(nodes: CanvasNode[]): CanvasNode[] {
  return nodes.map((n) => {
    const props = { ...n.props }
    if (typeof props.text === "string") {
      props.text = sanitizePlainText(props.text, 12000)
    }
    if (typeof props.label === "string") {
      props.label = sanitizePlainText(props.label, 500)
    }
    if (typeof props.alt === "string") {
      props.alt = sanitizePlainText(props.alt, 500)
    }
    if (typeof props.logoAlt === "string") {
      props.logoAlt = sanitizePlainText(props.logoAlt, 500)
    }
    if (typeof props.brandLabel === "string") {
      props.brandLabel = sanitizePlainText(props.brandLabel, 120)
    }
    if (typeof props.href === "string") {
      const h = props.href.trim()
      props.href =
        h.startsWith("http://") || h.startsWith("https://") || h.startsWith("mailto:") || h.startsWith("/")
          ? h.slice(0, 2000)
          : ""
    }
    if (props.textAlign !== undefined && props.textAlign !== "left" && props.textAlign !== "center" && props.textAlign !== "right") {
      delete props.textAlign
    }
    if (typeof props.embedUrl === "string") {
      props.embedUrl = isAllowedEmbedUrl(props.embedUrl) ? props.embedUrl.trim().slice(0, 2000) : ""
    }
    if (typeof props.src === "string") {
      const u = props.src.trim()
      if (u.startsWith("https://") || u.startsWith("/")) {
        props.src = u.slice(0, 2000)
      } else {
        props.src = ""
      }
    }
    if (typeof props.logoSrc === "string") {
      const u = props.logoSrc.trim()
      if (u.startsWith("https://") || u.startsWith("/")) {
        props.logoSrc = u.slice(0, 2000)
      } else {
        props.logoSrc = ""
      }
    }
    if (props.logoHeight !== undefined) {
      if (typeof props.logoHeight === "number" && Number.isFinite(props.logoHeight)) {
        props.logoHeight = Math.round(Math.min(120, Math.max(16, props.logoHeight)))
      } else {
        delete props.logoHeight
      }
    }
    if (Array.isArray(props.items)) {
      props.items = props.items.slice(0, 24).map((it) => ({
        src:
          typeof it?.src === "string" && (it.src.startsWith("https://") || it.src.startsWith("/"))
            ? it.src.slice(0, 2000)
            : undefined,
        alt: typeof it?.alt === "string" ? sanitizePlainText(it.alt, 300) : undefined,
      }))
    }
    if (Array.isArray(props.navItems)) {
      props.navItems = sanitizeNavItemsForPublish(props.navItems)
    }
    if (typeof props.introHint === "string") {
      props.introHint = sanitizePlainText(props.introHint, 500)
    }
    if (props.showProgramInterest !== undefined && typeof props.showProgramInterest !== "boolean") {
      delete props.showProgramInterest
    }
    sanitizeNodeChromeProps(props)
    return { ...n, props }
  })
}

export function buildPublishedSnapshot(input: {
  subdomain_slug: string
  template_key: string | null
  theme: ThemeTokens
  nav: NavItem[]
  pages: {
    path_slug: string
    title: string
    seo_title: string | null
    meta_description: string | null
    is_home: boolean
    sort_order: number
    canvas_nodes: CanvasNode[]
  }[]
}): PublishedSiteSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    subdomain_slug: input.subdomain_slug,
    template_key: input.template_key,
    theme: input.theme,
    nav: sanitizeNavItemsForPublish(input.nav as unknown[]),
    pages: input.pages
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({
        path_slug: p.path_slug,
        title: sanitizePlainText(p.title, 200),
        seo_title: p.seo_title ? sanitizePlainText(p.seo_title, 200) : null,
        meta_description: p.meta_description ? sanitizePlainText(p.meta_description, 500) : null,
        is_home: p.is_home,
        sort_order: p.sort_order,
        nodes: sanitizeCanvasNodesForPublish(p.canvas_nodes),
      })),
  }
}

export function parsePublishedSnapshot(raw: unknown): PublishedSiteSnapshot | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (o.version !== SNAPSHOT_VERSION) return null
  if (typeof o.subdomain_slug !== "string") return null
  if (!Array.isArray(o.pages)) return null
  return raw as PublishedSiteSnapshot
}
