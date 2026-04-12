import { PublicSiteRenderer } from "@/components/provider/website-builder/public-site-renderer"
import { ARTBOARD } from "@/lib/website-builder/layout-helpers"
import { TEMPLATE_LANDING, getTemplateDraft } from "@/lib/website-builder/templates/presets"
import type { TemplateKey } from "@/lib/website-builder/templates/presets-constants"
import type { PublishedPageSnapshot, PublishedSiteSnapshot } from "@/lib/website-builder/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"

type LandingMeta = (typeof TEMPLATE_LANDING)[TemplateKey]

function templatePreviewSnapshot(templateKey: TemplateKey): {
  snapshot: PublishedSiteSnapshot
  page: PublishedPageSnapshot
} {
  const draft = getTemplateDraft(templateKey, previewIdGenerator(templateKey))
  const pages: PublishedPageSnapshot[] = draft.pages.map((page) => ({
    path_slug: page.path_slug,
    title: page.title,
    seo_title: page.seo_title ?? null,
    meta_description: page.meta_description ?? null,
    is_home: page.is_home,
    sort_order: page.sort_order,
    nodes: page.canvas_nodes,
  }))
  const homePage = pages.find((page) => page.is_home || page.path_slug === "") ?? pages[0]
  return {
    snapshot: {
      version: 1,
      subdomain_slug: "preview",
      template_key: templateKey,
      theme: draft.theme_tokens,
      nav: draft.nav_items,
      pages,
    },
    page: homePage,
  }
}

function previewIdGenerator(templateKey: TemplateKey) {
  let idx = 0
  return () => `template-preview-${templateKey}-${idx++}`
}

const PREVIEW_SNAPSHOTS: Record<TemplateKey, { snapshot: PublishedSiteSnapshot; page: PublishedPageSnapshot }> = {
  montessori: templatePreviewSnapshot("montessori"),
  premium: templatePreviewSnapshot("premium"),
  community: templatePreviewSnapshot("community"),
  sports: templatePreviewSnapshot("sports"),
}
const PREVIEW_DESKTOP_SCALE = 0.36

export function TemplatePreviewCard({
  templateKey,
  meta,
  className,
  footer,
}: {
  templateKey: TemplateKey
  meta: LandingMeta
  className?: string
  footer: React.ReactNode
}) {
  const preview = meta.preview
  const renderedPreview = PREVIEW_SNAPSHOTS[templateKey]
  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        preview === "montessori" && "border-emerald-900/10",
        preview === "premium" && "border-amber-900/15",
        preview === "community" && "border-orange-300/30",
        preview === "sports" && "border-blue-300/35",
        className,
      )}
    >
      <div className="relative h-2 w-full shrink-0 overflow-hidden">
        {preview === "premium" ? (
          <div className="grid h-full w-full grid-cols-3">
            <span className="flex-1 bg-zinc-900" />
            <span className="flex-1" style={{ backgroundColor: meta.primary }} />
            <span className="flex-1 bg-zinc-100" />
          </div>
        ) : preview === "community" ? (
          <div
            className="h-full w-full opacity-90"
            style={{
              background: `linear-gradient(110deg, ${meta.primary} 0%, ${meta.secondary} 40%, ${meta.background} 100%)`,
            }}
          />
        ) : preview === "sports" ? (
          <div className="flex h-full w-full">
            <span className="flex-1 bg-blue-600" />
            <span className="flex-1 bg-orange-500" />
            <span className="flex-1 bg-blue-800" />
          </div>
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(90deg, ${meta.primary} 0%, ${meta.secondary} 40%, ${meta.background} 100%)`,
            }}
          />
        )}
      </div>
      <CardHeader className="space-y-2.5 pb-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground max-w-[95%] text-[11px] font-semibold uppercase tracking-[0.14em]">
            {meta.tagline}
          </p>
          <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold">
            <Sparkles className="h-3 w-3" />
            Parent-ready
          </span>
        </div>
        <CardTitle className="text-xl leading-tight tracking-tight">{meta.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm leading-relaxed">{meta.description}</CardDescription>
        {"bestFor" in meta && typeof meta.bestFor === "string" && (
          <p className="text-foreground/85 rounded-lg bg-muted/40 px-2.5 py-2 text-xs font-medium">
            Best for: {meta.bestFor}
          </p>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative h-[170px] w-full overflow-hidden rounded-xl border border-black/10 bg-background shadow-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 origin-top"
            style={{
              width: `${ARTBOARD.desktop.w}px`,
              transform: `translateX(-50%) scale(${PREVIEW_DESKTOP_SCALE})`,
            }}
          >
            <PublicSiteRenderer snapshot={renderedPreview.snapshot} siteBase="/preview-template" page={renderedPreview.page} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/28" />
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex flex-col gap-3 border-t bg-muted/25 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <span
            className="h-7 w-7 rounded-full border border-black/10 shadow-sm"
            style={{ backgroundColor: meta.primary }}
            title="Primary"
          />
          <span
            className="h-7 w-7 rounded-full border border-black/10 shadow-sm"
            style={{ backgroundColor: meta.secondary }}
            title="Secondary"
          />
          <span
            className="h-7 w-7 rounded-full border border-black/10 shadow-sm"
            style={{ backgroundColor: meta.background }}
            title="Background"
          />
        </div>
        <div className="w-full sm:w-auto">{footer}</div>
      </CardFooter>
    </Card>
  )
}
