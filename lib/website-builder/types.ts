import type { Json } from "@/lib/supabaseDatabase"

export type WebsiteBuilderBreakpoint = "desktop" | "tablet" | "mobile"

export type CanvasNodeType =
  | "text"
  | "image"
  | "button"
  | "video"
  | "navbar"
  | "footer"
  | "section"
  | "gallery"
  /** Contact / lead form (submits to guest inquiries; source microsite) */
  | "contactForm"

export interface LayoutRect {
  x: number
  y: number
  w: number
  h: number
}

export type LayoutByBreakpoint = Partial<Record<WebsiteBuilderBreakpoint, LayoutRect>>

export type NavItemVariant = "link" | "button"

/** Navbar entry: `path` is internal slug ("" = home) or full `https://` / `mailto:` URL */
export interface NavItem {
  /** Stable key for React lists (optional; generated in editor when missing) */
  id?: string
  label: string
  path: string
  variant?: NavItemVariant
  /** Only applied for external http(s) links */
  openInNewTab?: boolean
}

export interface GalleryItem {
  src?: string
  alt?: string
}

export interface CanvasNodeProps {
  text?: string
  src?: string
  alt?: string
  /** navbar: optional brand logo image URL */
  logoSrc?: string
  /** navbar: optional logo alt text */
  logoAlt?: string
  /** navbar: logo height in px */
  logoHeight?: number
  /** navbar: shown when compact nav and no logo (e.g. site name) */
  brandLabel?: string
  href?: string
  label?: string
  embedUrl?: string
  items?: GalleryItem[]
  navItems?: NavItem[]
  fontFamily?: string
  fontSize?: number
  fontWeight?: string | number
  color?: string
  backgroundColor?: string
  borderRadius?: number
  textAlign?: "left" | "center" | "right"
  /** @deprecated Prefer paddingTop/Right/Bottom/Left; still applied when no per-side values exist */
  padding?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  borderWidth?: number
  borderColor?: string
  borderStyle?: "none" | "solid" | "dashed" | "dotted"
  /** Flex/grid gap between child items (navbar, gallery), px */
  gap?: number
  /** contactForm: optional heading above fields */
  introHint?: string
  /** contactForm: show program interest field */
  showProgramInterest?: boolean
}

export interface CanvasNode {
  id: string
  type: CanvasNodeType
  parentId: string | null
  zIndex: number
  props: CanvasNodeProps
  layout: LayoutByBreakpoint
}

export interface ThemeTokens {
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  fontFamily?: string
  headingFontFamily?: string
}

export const SNAPSHOT_VERSION = 1 as const

export interface PublishedPageSnapshot {
  path_slug: string
  title: string
  seo_title: string | null
  meta_description: string | null
  is_home: boolean
  sort_order: number
  nodes: CanvasNode[]
}

export interface PublishedSiteSnapshot {
  version: typeof SNAPSHOT_VERSION
  subdomain_slug: string
  template_key: string | null
  theme: ThemeTokens
  nav: NavItem[]
  pages: PublishedPageSnapshot[]
}

export interface TemplateDraftPage {
  path_slug: string
  title: string
  seo_title?: string | null
  meta_description?: string | null
  is_home: boolean
  sort_order: number
  canvas_nodes: CanvasNode[]
}

export interface TemplateDraft {
  template_key: string
  theme_tokens: ThemeTokens
  nav_items: NavItem[]
  pages: TemplateDraftPage[]
}

const CANVAS_NODE_TYPES = new Set<string>([
  "text",
  "image",
  "button",
  "video",
  "navbar",
  "footer",
  "section",
  "gallery",
  "contactForm",
])

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v)
}

function isCanvasNodeType(t: string): t is CanvasNodeType {
  return CANVAS_NODE_TYPES.has(t)
}

export function parseCanvasNodes(raw: Json): CanvasNode[] {
  if (!Array.isArray(raw)) return []
  const out: CanvasNode[] = []
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const id = item.id
    const type = item.type
    if (typeof id !== "string" || !id.trim()) continue
    if (typeof type !== "string" || !isCanvasNodeType(type)) continue
    const parentId =
      item.parentId === null
        ? null
        : typeof item.parentId === "string"
          ? item.parentId
          : null
    const zIndex =
      typeof item.zIndex === "number" && Number.isFinite(item.zIndex) ? item.zIndex : 0
    const props = isPlainObject(item.props) ? (item.props as CanvasNodeProps) : {}
    const layout = isPlainObject(item.layout) ? (item.layout as LayoutByBreakpoint) : {}
    out.push({ id, type, parentId, zIndex, props, layout })
  }
  return out
}

export function parseNavItems(raw: Json): NavItem[] {
  if (!Array.isArray(raw)) return []
  const out: NavItem[] = []
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const label = item.label
    const path = item.path
    if (typeof label !== "string" || typeof path !== "string") continue
    const nav: NavItem = { label, path }
    if (typeof item.id === "string" && item.id) nav.id = item.id
    if (item.variant === "link" || item.variant === "button") nav.variant = item.variant
    if (typeof item.openInNewTab === "boolean") nav.openInNewTab = item.openInNewTab
    out.push(nav)
  }
  return out
}

export function parseThemeTokens(raw: Json): ThemeTokens {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ThemeTokens
  }
  return {}
}
