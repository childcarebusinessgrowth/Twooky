import { ARTBOARD, pickLayoutWithMobileResolver, resolveMobileLayoutMap } from "./layout-helpers"
import { resolveMarginSides } from "./node-chrome-styles"
import type { CanvasNode, CanvasNodeType, LayoutRect } from "./types"
import { resolveVideoEmbedUrl } from "./video-embed"

export type MobileValidationIssueCode =
  | "node_out_of_bounds"
  | "node_too_small"
  | "node_invalid_rect"
  | "node_overlap"
  | "video_url_invalid"

export interface MobileValidationIssue {
  pageId?: string
  pageSlug: string
  pageTitle: string
  nodeId: string
  nodeType: CanvasNodeType
  code: MobileValidationIssueCode
  message: string
}

export interface MobileValidationResult {
  ok: boolean
  issues: MobileValidationIssue[]
}

export interface MobileValidationPageInput {
  id?: string
  path_slug: string
  title: string
  canvas_nodes: CanvasNode[]
}

const MIN_SIZE_BY_TYPE: Partial<Record<CanvasNodeType, { w: number; h: number }>> = {
  button: { w: 120, h: 40 },
  image: { w: 120, h: 120 },
  video: { w: 180, h: 120 },
  navbar: { w: 280, h: 44 },
  footer: { w: 280, h: 48 },
  gallery: { w: 220, h: 140 },
  contactForm: { w: 280, h: 280 },
  text: { w: 120, h: 28 },
}

const MAX_ISSUES = 120

function intersects(a: LayoutRect, b: LayoutRect) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

function nodeLabel(node: CanvasNode) {
  if (node.type === "button") return `Button "${node.props.label ?? "Untitled"}"`
  if (node.type === "text") return "Text block"
  if (node.type === "image") return "Image block"
  if (node.type === "video") return "Video block"
  if (node.type === "gallery") return "Gallery block"
  if (node.type === "contactForm") return "Contact form"
  if (node.type === "navbar") return "Navbar"
  if (node.type === "footer") return "Footer"
  return "Section"
}

function pageLabel(page: Pick<MobileValidationPageInput, "path_slug" | "title">) {
  if (page.title.trim()) return page.title.trim()
  if (page.path_slug.trim()) return page.path_slug.trim()
  return "Home"
}

function issueFor(
  page: MobileValidationPageInput,
  node: CanvasNode,
  code: MobileValidationIssueCode,
  message: string,
): MobileValidationIssue {
  return {
    pageId: page.id,
    pageSlug: page.path_slug,
    pageTitle: pageLabel(page),
    nodeId: node.id,
    nodeType: node.type,
    code,
    message,
  }
}

export function validateMobileWebsite(input: { pages: MobileValidationPageInput[] }): MobileValidationResult {
  const issues: MobileValidationIssue[] = []
  const mobileWidth = ARTBOARD.mobile.w

  for (const page of input.pages) {
    const mobileMap = resolveMobileLayoutMap(page.canvas_nodes)
    const effective = page.canvas_nodes.map((node) => ({
      node,
      rect: pickLayoutWithMobileResolver(node, "mobile", mobileMap),
    }))

    for (const { node, rect } of effective) {
      if (issues.length >= MAX_ISSUES) break

      if (!(Number.isFinite(rect.x) && Number.isFinite(rect.y) && Number.isFinite(rect.w) && Number.isFinite(rect.h)) || rect.w <= 0 || rect.h <= 0) {
        issues.push(
          issueFor(
            page,
            node,
            "node_invalid_rect",
            `${nodeLabel(node)} has an invalid mobile size/position. Resize or re-add this block.`,
          ),
        )
        continue
      }

      const min = MIN_SIZE_BY_TYPE[node.type]
      if (min && (rect.w < min.w || rect.h < min.h)) {
        issues.push(
          issueFor(
            page,
            node,
            "node_too_small",
            `${nodeLabel(node)} is too small on mobile (${Math.round(rect.w)}x${Math.round(rect.h)}).`,
          ),
        )
      }

      const margins = resolveMarginSides(node.props)
      const left = rect.x - margins.left
      const right = rect.x + rect.w + margins.right
      if (left < 0 || right > mobileWidth) {
        issues.push(
          issueFor(
            page,
            node,
            "node_out_of_bounds",
            `${nodeLabel(node)} overflows the mobile viewport horizontally.`,
          ),
        )
      }

      if (node.type === "video" && typeof node.props.embedUrl === "string" && node.props.embedUrl.trim()) {
        if (!resolveVideoEmbedUrl(node.props.embedUrl)) {
          issues.push(
            issueFor(
              page,
              node,
              "video_url_invalid",
              `${nodeLabel(node)} has an invalid or unsupported mobile embed URL.`,
            ),
          )
        }
      }
    }

    for (let i = 0; i < effective.length; i++) {
      if (issues.length >= MAX_ISSUES) break
      const a = effective[i]
      if (!a || a.node.type === "section") continue
      const am = resolveMarginSides(a.node.props)
      const rectA: LayoutRect = {
        x: a.rect.x - am.left,
        y: a.rect.y - am.top,
        w: a.rect.w + am.left + am.right,
        h: a.rect.h + am.top + am.bottom,
      }
      for (let j = i + 1; j < effective.length; j++) {
        if (issues.length >= MAX_ISSUES) break
        const b = effective[j]
        if (!b || b.node.type === "section") continue
        const bm = resolveMarginSides(b.node.props)
        const rectB: LayoutRect = {
          x: b.rect.x - bm.left,
          y: b.rect.y - bm.top,
          w: b.rect.w + bm.left + bm.right,
          h: b.rect.h + bm.top + bm.bottom,
        }
        if (intersects(rectA, rectB)) {
          issues.push(
            issueFor(
              page,
              a.node,
              "node_overlap",
              `${nodeLabel(a.node)} overlaps ${nodeLabel(b.node)} on mobile. Adjust spacing or order.`,
            ),
          )
          break
        }
      }
    }
  }

  return { ok: issues.length === 0, issues }
}

export function summarizeMobileValidationIssues(
  issues: MobileValidationIssue[],
  maxItems = 3,
): string {
  if (!issues.length) return "No mobile issues found."
  const sample = issues.slice(0, Math.max(1, maxItems))
  const detail = sample
    .map((it) => `[${it.pageTitle}] ${it.message}`)
    .join(" ")
  if (issues.length <= sample.length) {
    return `Publish blocked: ${detail}`
  }
  return `Publish blocked: ${detail} (${issues.length - sample.length} more issue${issues.length - sample.length === 1 ? "" : "s"}).`
}
