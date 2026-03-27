import { describe, expect, it } from "vitest"
import {
  buildPublishedSnapshot,
  isAllowedEmbedUrl,
  parsePublishedSnapshot,
  sanitizeCanvasNodesForPublish,
  sanitizeNavItemPath,
} from "../snapshot"
import type { CanvasNode, NavItemVariant } from "../types"
import { SNAPSHOT_VERSION } from "../types"

describe("isAllowedEmbedUrl", () => {
  it("allows YouTube and Vimeo hosts", () => {
    expect(isAllowedEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true)
    expect(isAllowedEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true)
    expect(isAllowedEmbedUrl("https://vimeo.com/12345")).toBe(true)
  })
  it("rejects arbitrary domains", () => {
    expect(isAllowedEmbedUrl("https://evil.com/x")).toBe(false)
  })
})

describe("sanitizeNavItemPath", () => {
  it("normalizes internal slugs", () => {
    expect(sanitizeNavItemPath("  About-Us  ")).toBe("about-us")
    expect(sanitizeNavItemPath("")).toBe("")
  })
  it("keeps valid http(s) URLs", () => {
    expect(sanitizeNavItemPath("  https://example.com/foo?x=1  ")).toBe("https://example.com/foo?x=1")
  })
  it("rejects invalid URLs", () => {
    expect(sanitizeNavItemPath("https://")).toBe("")
  })
})

describe("sanitizeCanvasNodesForPublish", () => {
  it("strips disallowed embed URLs", () => {
    const nodes: CanvasNode[] = [
      {
        id: "1",
        type: "video",
        parentId: null,
        zIndex: 1,
        props: { embedUrl: "https://evil.com" },
        layout: {},
      },
    ]
    const out = sanitizeCanvasNodesForPublish(nodes)
    expect(out[0].props.embedUrl).toBe("")
  })

  it("sanitizes navbar items: slug vs external URL and variant", () => {
    const nodes: CanvasNode[] = [
      {
        id: "n1",
        type: "navbar",
        parentId: null,
        zIndex: 1,
        props: {
          navItems: [
            { label: "Home", path: "" },
            { label: "Ext", path: "https://example.com", variant: "button", openInNewTab: true },
            { label: "Mail", path: "mailto:a@b.co", openInNewTab: true },
            { label: "Bad", path: "javascript:alert(1)" },
            { label: "X", path: "x", variant: "oops" as unknown as NavItemVariant },
          ],
        },
        layout: {},
      },
    ]
    const out = sanitizeCanvasNodesForPublish(nodes)
    const nav = out[0].props.navItems!
    expect(nav[0]?.path).toBe("")
    expect(nav[1]).toMatchObject({ path: "https://example.com/", variant: "button", openInNewTab: true })
    expect(nav[2]?.openInNewTab).toBeFalsy()
    expect(nav[3]?.path).toBe("")
    expect(nav[4]?.variant).toBe("link")
  })

  it("sanitizes navbar logo fields", () => {
    const nodes: CanvasNode[] = [
      {
        id: "n-logo",
        type: "navbar",
        parentId: null,
        zIndex: 1,
        props: {
          logoSrc: "javascript:alert(1)",
          logoAlt: "<b>School</b> logo",
          logoHeight: -10,
        },
        layout: {},
      },
      {
        id: "n-logo-ok",
        type: "navbar",
        parentId: null,
        zIndex: 2,
        props: {
          logoSrc: " https://example.com/logo.png ",
          logoAlt: " Main brand ",
          logoHeight: 58.6,
        },
        layout: {},
      },
      {
        id: "n-logo-bad-height",
        type: "navbar",
        parentId: null,
        zIndex: 3,
        props: {
          logoSrc: "/uploads/logo.png",
          logoHeight: Number.NaN,
        },
        layout: {},
      },
    ]
    const out = sanitizeCanvasNodesForPublish(nodes)
    expect(out[0].props.logoSrc).toBe("")
    expect(out[0].props.logoAlt).toBe("School logo")
    expect(out[0].props.logoHeight).toBe(16)
    expect(out[1].props.logoSrc).toBe("https://example.com/logo.png")
    expect(out[1].props.logoAlt).toBe(" Main brand ")
    expect(out[1].props.logoHeight).toBe(59)
    expect(out[2].props.logoHeight).toBeUndefined()
  })

  it("clamps margin, padding, gap and normalizes border props for publish", () => {
    const nodes: CanvasNode[] = [
      {
        id: "chrome1",
        type: "text",
        parentId: null,
        zIndex: 1,
        props: {
          marginTop: 999,
          paddingLeft: 500,
          gap: 200,
          borderWidth: 99,
          borderStyle: "double" as never,
          borderColor: "not-a-color",
        },
        layout: {},
      },
    ]
    const out = sanitizeCanvasNodesForPublish(nodes)
    const p = out[0].props
    expect(p.marginTop).toBe(120)
    expect(p.paddingLeft).toBe(120)
    expect(p.gap).toBe(120)
    expect(p.borderWidth).toBe(24)
    expect(p.borderStyle).toBeUndefined()
    expect(p.borderColor).toBeUndefined()
  })
})

describe("buildPublishedSnapshot + parsePublishedSnapshot", () => {
  it("round-trips snapshot shape", () => {
    const snap = buildPublishedSnapshot({
      subdomain_slug: "demo-nursery",
      template_key: "montessori",
      theme: { primaryColor: "#000" },
      nav: [{ label: "Home", path: "" }],
      pages: [
        {
          path_slug: "",
          title: "Home",
          seo_title: "Home",
          meta_description: "Hi",
          is_home: true,
          sort_order: 0,
          canvas_nodes: [],
        },
      ],
    })
    expect(snap.version).toBe(SNAPSHOT_VERSION)
    const again = parsePublishedSnapshot(snap as unknown)
    expect(again?.subdomain_slug).toBe("demo-nursery")
  })
})
