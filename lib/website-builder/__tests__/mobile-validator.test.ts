import { describe, expect, it } from "vitest"
import { layoutTriple } from "../layout-helpers"
import { summarizeMobileValidationIssues, validateMobileWebsite } from "../mobile-validator"
import { TEMPLATE_KEYS, getTemplateDraft } from "../templates/presets"
import type { CanvasNode } from "../types"

function makeNode(partial: Partial<CanvasNode> & Pick<CanvasNode, "id" | "type">): CanvasNode {
  return {
    id: partial.id,
    type: partial.type,
    parentId: null,
    zIndex: partial.zIndex ?? 1,
    props: partial.props ?? {},
    layout: partial.layout ?? layoutTriple(12, 100, 366, 120),
  }
}

describe("validateMobileWebsite", () => {
  it("passes healthy mobile layouts", () => {
    const nodes: CanvasNode[] = [
      makeNode({
        id: "nav",
        type: "navbar",
        layout: layoutTriple(0, 0, 1200, 64),
        props: { navItems: [{ label: "Home", path: "" }] },
      }),
      makeNode({
        id: "hero",
        type: "text",
        layout: layoutTriple(48, 120, 900, 60),
        props: { text: "Welcome", fontSize: 36 },
      }),
      makeNode({
        id: "cta",
        type: "button",
        layout: layoutTriple(48, 220, 260, 48),
        props: { label: "Book now", href: "/contact" },
      }),
    ]

    const result = validateMobileWebsite({
      pages: [{ id: "p1", path_slug: "", title: "Home", canvas_nodes: nodes }],
    })
    expect(result.ok).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it("fails when a block overflows mobile width", () => {
    const nodes: CanvasNode[] = [
      makeNode({
        id: "btn-overflow",
        type: "button",
        layout: layoutTriple(48, 200, 260, 48),
        props: { label: "Overflow", marginLeft: 24, marginRight: 24 },
      }),
    ]
    const result = validateMobileWebsite({
      pages: [{ id: "p1", path_slug: "about", title: "About", canvas_nodes: nodes }],
    })
    expect(result.ok).toBe(false)
    expect(result.issues.some((it) => it.code === "node_out_of_bounds")).toBe(true)
  })

  it("fails when touch target is too small", () => {
    const nodes: CanvasNode[] = [
      makeNode({
        id: "tiny-btn",
        type: "button",
        layout: layoutTriple(48, 200, 90, 30),
        props: { label: "Tap", href: "/contact" },
      }),
    ]
    const result = validateMobileWebsite({
      pages: [{ id: "p1", path_slug: "fees", title: "Fees", canvas_nodes: nodes }],
    })
    expect(result.ok).toBe(false)
    expect(result.issues.some((it) => it.code === "node_too_small")).toBe(true)
    expect(summarizeMobileValidationIssues(result.issues)).toContain("Publish blocked")
  })

  it("passes all built-in template drafts", () => {
    for (const key of TEMPLATE_KEYS) {
      const draft = getTemplateDraft(key, () => crypto.randomUUID())
      const result = validateMobileWebsite({ pages: draft.pages })
      expect(result.ok, `${key} has issues: ${JSON.stringify(result.issues.slice(0, 3))}`).toBe(true)
    }
  })
})
