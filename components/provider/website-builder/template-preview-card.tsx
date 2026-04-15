import { PublicSiteRenderer } from "@/components/provider/website-builder/public-site-renderer"
import { ARTBOARD } from "@/lib/website-builder/layout-helpers"
import { TEMPLATE_LANDING, getTemplateDraft } from "@/lib/website-builder/templates/presets"
import type { TemplateKey } from "@/lib/website-builder/templates/presets-constants"
import type { PublishedPageSnapshot, PublishedSiteSnapshot } from "@/lib/website-builder/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Eye, Sparkles } from "lucide-react"

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
const PREVIEW_DESKTOP_SCALE = 0.45

const PREVIEW_BADGES: Record<TemplateKey, string> = {
  montessori: "Calm",
  premium: "Boutique",
  community: "Family-first",
  sports: "Active",
}

const PREVIEW_HINTS: Record<TemplateKey, string> = {
  montessori: "Natural and reassuring",
  premium: "Editorial and luxurious",
  community: "Warm and neighbourly",
  sports: "Energetic and playful",
}

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
        "group flex h-full flex-col gap-0 overflow-hidden rounded-4xl border border-border/60 bg-card/95 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]",
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
      <CardContent className="px-4 pb-4 pt-4 sm:px-5 sm:pt-5">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-black/8 bg-[linear-gradient(180deg,#fff_0%,#f8fafc_100%)] shadow-[0_20px_40px_rgba(15,23,42,0.10)]">
          <div className="flex items-center justify-between border-b border-black/6 bg-white/90 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
              <Eye className="h-3.5 w-3.5" />
              Live preview
            </div>
          </div>
          <div className="relative h-[225px] w-full overflow-hidden bg-background sm:h-[245px]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-5 top-4 h-14 rounded-full blur-2xl"
              style={{ backgroundColor: `${meta.primary}26` }}
            />
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-white via-white/72 to-transparent" />
          </div>
        </div>
      </CardContent>
      <CardHeader className="space-y-3 px-5 pb-4 pt-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
              {meta.tagline}
            </p>
            <CardTitle className="text-[1.55rem] leading-tight tracking-tight">{meta.title}</CardTitle>
          </div>
          <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold">
            <Sparkles className="h-3 w-3" />
              {PREVIEW_BADGES[templateKey]}
          </span>
        </div>
        <CardDescription className="line-clamp-2 text-[0.95rem] leading-relaxed text-foreground/72">
          {meta.description}
        </CardDescription>
        {"bestFor" in meta && typeof meta.bestFor === "string" && (
          <p className="rounded-2xl border border-border/70 bg-muted/30 px-3 py-2.5 text-sm leading-relaxed text-foreground/85">
            <span className="mr-1 font-semibold">Best for:</span>
            {meta.bestFor}
          </p>
        )}
      </CardHeader>
      <CardFooter className="mt-auto flex flex-col gap-3 border-t border-border/60 bg-muted/18 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <span
              className="h-8 w-8 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: meta.primary }}
              title="Primary"
            />
            <span
              className="h-8 w-8 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: meta.secondary }}
              title="Secondary"
            />
            <span
              className="h-8 w-8 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: meta.background }}
              title="Background"
            />
          </div>
          <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
            {PREVIEW_HINTS[templateKey]}
          </span>
        </div>
        <div className="w-full sm:w-auto">{footer}</div>
      </CardFooter>
    </Card>
  )
}
