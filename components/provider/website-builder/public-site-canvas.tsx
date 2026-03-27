"use client"

import { useLayoutEffect, useMemo, useState } from "react"
import { CanvasNodeContent } from "@/components/provider/website-builder/canvas-node-content"
import { flexJustifyContent } from "@/lib/website-builder/alignment"
import { ARTBOARD, pickLayoutWithMobileResolver, resolveMobileLayoutMap } from "@/lib/website-builder/layout-helpers"
import {
  innerBoxStyle,
  marginBottomForLayout,
  outerMarginStyle,
} from "@/lib/website-builder/node-chrome-styles"
import { resolveVideoEmbedUrl } from "@/lib/website-builder/video-embed"
import { alignFooterForPublishedPageLayout } from "@/lib/website-builder/templates/presets"
import type {
  CanvasNode,
  PublishedPageSnapshot,
  PublishedSiteSnapshot,
  ThemeTokens,
  WebsiteBuilderBreakpoint,
} from "@/lib/website-builder/types"

function viewportBreakpoint(): WebsiteBuilderBreakpoint {
  if (typeof window === "undefined") return "desktop"
  const w = window.innerWidth
  if (w < 768) return "mobile"
  if (w < 1024) return "tablet"
  return "desktop"
}

function pct(n: number, base: number) {
  return `${(n / base) * 100}%`
}

function nodeBox(rect: { x: number; y: number; w: number; h: number }, artW: number, artH: number) {
  return {
    position: "absolute" as const,
    left: pct(rect.x, artW),
    top: pct(rect.y, artH),
    width: pct(rect.w, artW),
    height: pct(Math.max(rect.h, 24), artH),
  }
}

function artboardHeightPx(
  page: PublishedPageSnapshot,
  bp: WebsiteBuilderBreakpoint,
  mobileMap: Map<string, { x: number; y: number; w: number; h: number }> | null,
) {
  let bottom = 400
  for (const n of page.nodes) {
    const r = pickLayoutWithMobileResolver(n, bp, mobileMap)
    const bottomGutter = n.type === "footer" ? 0 : 24
    bottom = Math.max(bottom, r.y + r.h + bottomGutter + marginBottomForLayout(n.props))
  }
  const cap = bp === "mobile" ? 12000 : 2400
  return Math.min(Math.max(bottom, 600), cap)
}

function renderNode(
  n: CanvasNode,
  siteBase: string,
  theme: ThemeTokens,
  subdomainSlug: string,
  bp: WebsiteBuilderBreakpoint,
  artH: number,
  mobileMap: Map<string, { x: number; y: number; w: number; h: number }> | null,
) {
  const artW = ARTBOARD[bp].w
  const isMobileBreakpoint = bp === "mobile"
  const navbarCompact = bp !== "desktop"
  const L = pickLayoutWithMobileResolver(n, bp, mobileMap)
  const box = nodeBox(L, artW, artH)
  const p = n.props
  const outer = { ...box, ...outerMarginStyle(p), zIndex: n.zIndex } as const

  switch (n.type) {
    case "section":
      return (
        <div key={n.id} style={outer}>
          <CanvasNodeContent
            node={n}
            siteBase={siteBase}
            theme={theme}
            variant="published"
            subdomainSlug={subdomainSlug}
            isMobileBreakpoint={isMobileBreakpoint}
            navbarCompact={navbarCompact}
          />
        </div>
      )
    case "text":
      const textOuter = {
        ...outer,
        height: "auto",
        minHeight: pct(Math.max(L.h, 24), artH),
      } as const
      return (
        <div key={n.id} style={textOuter}>
          <div style={innerBoxStyle(p)}>
            <CanvasNodeContent
              node={n}
              siteBase={siteBase}
              theme={theme}
              variant="published"
              subdomainSlug={subdomainSlug}
              isMobileBreakpoint={isMobileBreakpoint}
              navbarCompact={navbarCompact}
            />
          </div>
        </div>
      )
    case "button":
      return (
        <div
          key={n.id}
          style={{
            ...outer,
            display: "flex",
            alignItems: "center",
            justifyContent: flexJustifyContent(p.textAlign, "center"),
          }}
        >
          <CanvasNodeContent
            node={n}
            siteBase={siteBase}
            theme={theme}
            variant="published"
            subdomainSlug={subdomainSlug}
            isMobileBreakpoint={isMobileBreakpoint}
            navbarCompact={navbarCompact}
          />
        </div>
      )
    case "image": {
      if (!p.src) {
        return (
          <div key={n.id} style={outer}>
            <div
              className="h-full w-full"
              style={{
                ...innerBoxStyle(p),
                background: "#e2e8f0",
                overflow: "hidden",
              }}
            />
          </div>
        )
      }
      return (
        <div key={n.id} style={outer}>
          <div
            className="relative h-full w-full"
            style={{
              ...innerBoxStyle(p),
              overflow: "hidden",
            }}
          >
            <CanvasNodeContent
              node={n}
              siteBase={siteBase}
              theme={theme}
              variant="published"
              subdomainSlug={subdomainSlug}
              isMobileBreakpoint={isMobileBreakpoint}
              navbarCompact={navbarCompact}
            />
          </div>
        </div>
      )
    }
    case "video": {
      const embed = resolveVideoEmbedUrl(p.embedUrl ?? "")
      if (!embed) {
        return (
          <div
            key={n.id}
            style={{
              ...outer,
              display: "flex",
              alignItems: "center",
              justifyContent: flexJustifyContent(p.textAlign, "center"),
            }}
          >
            <div
              className="h-full w-full"
              style={{
                ...innerBoxStyle(p),
                background: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: flexJustifyContent(p.textAlign, "center"),
              }}
            />
          </div>
        )
      }
      return (
        <div key={n.id} style={outer}>
          <div
            style={{
              ...innerBoxStyle(p),
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: flexJustifyContent(p.textAlign, "center"),
            }}
          >
            <CanvasNodeContent
              node={n}
              siteBase={siteBase}
              theme={theme}
              variant="published"
              subdomainSlug={subdomainSlug}
              isMobileBreakpoint={isMobileBreakpoint}
              navbarCompact={navbarCompact}
            />
          </div>
        </div>
      )
    }
    case "navbar":
      return (
        <div key={n.id} style={outer}>
          <CanvasNodeContent
            node={n}
            siteBase={siteBase}
            theme={theme}
            variant="published"
            subdomainSlug={subdomainSlug}
            isMobileBreakpoint={isMobileBreakpoint}
            navbarCompact={navbarCompact}
          />
        </div>
      )
    case "footer":
      return (
        <div key={n.id} style={outer}>
          <CanvasNodeContent
            node={n}
            siteBase={siteBase}
            theme={theme}
            variant="published"
            subdomainSlug={subdomainSlug}
            isMobileBreakpoint={isMobileBreakpoint}
            navbarCompact={navbarCompact}
          />
        </div>
      )
    case "gallery":
      return (
        <div key={n.id} style={outer}>
          <CanvasNodeContent
            node={n}
            siteBase={siteBase}
            theme={theme}
            variant="published"
            subdomainSlug={subdomainSlug}
            isMobileBreakpoint={isMobileBreakpoint}
            navbarCompact={navbarCompact}
          />
        </div>
      )
    case "contactForm": {
      // Layout `h` is a canvas budget; the real form is shorter. Use content height so the card
      // does not stretch with empty space below the submit button (see innerBoxStyle h-full).
      const contactOuter = {
        ...outer,
        height: "auto",
        minHeight: 0,
      } as const
      return (
        <div key={n.id} style={contactOuter}>
          <CanvasNodeContent
            node={n}
            siteBase={siteBase}
            theme={theme}
            variant="published"
            subdomainSlug={subdomainSlug}
            isMobileBreakpoint={isMobileBreakpoint}
            navbarCompact={navbarCompact}
          />
        </div>
      )
    }
    default:
      return null
  }
}

export function PublicSiteRenderer({
  snapshot,
  siteBase,
  page,
}: {
  snapshot: PublishedSiteSnapshot
  siteBase: string
  page: PublishedPageSnapshot
}) {
  const [bp, setBp] = useState<WebsiteBuilderBreakpoint>("desktop")

  useLayoutEffect(() => {
    function tick() {
      setBp(viewportBreakpoint())
    }
    tick()
    window.addEventListener("resize", tick)
    return () => window.removeEventListener("resize", tick)
  }, [])

  const theme = snapshot.theme
  const pageForRender = useMemo(
    (): PublishedPageSnapshot => ({
      ...page,
      nodes: alignFooterForPublishedPageLayout(page.path_slug, page.nodes),
    }),
    [page],
  )
  const sorted = useMemo(
    () => [...pageForRender.nodes].sort((a, b) => a.zIndex - b.zIndex),
    [pageForRender.nodes],
  )
  const artW = ARTBOARD[bp].w
  const mobileMap = useMemo(
    () => (bp === "mobile" ? resolveMobileLayoutMap(pageForRender.nodes) : null),
    [bp, pageForRender.nodes],
  )
  const h = artboardHeightPx(pageForRender, bp, mobileMap)

  return (
    <div
      className="w-full overflow-x-clip"
      style={{
        width: "100%",
        maxWidth: "100%",
        backgroundColor: theme.backgroundColor ?? "#f8fafc",
        fontFamily: theme.fontFamily ?? "system-ui, sans-serif",
      }}
    >
      <div className="w-full">
        <div
          className="relative w-full overflow-hidden"
          style={{
            paddingBottom: `${(h / artW) * 100}%`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ backgroundColor: theme.backgroundColor ?? "#f8fafc" }}
          />
          <div className="absolute inset-0 z-1">
            {sorted.map((n) => renderNode(n, siteBase, theme, snapshot.subdomain_slug, bp, h, mobileMap))}
          </div>
        </div>
      </div>
    </div>
  )
}
