import { TEMPLATE_LANDING } from "@/lib/website-builder/templates/presets"
import type { TemplateKey } from "@/lib/website-builder/templates/presets-constants"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type LandingMeta = (typeof TEMPLATE_LANDING)[TemplateKey]

function MiniPreview({ variant, primary, secondary, surface }: { variant: LandingMeta["preview"]; primary: string; secondary: string; surface: string }) {
  switch (variant) {
    case "montessori":
      return (
        <div className="relative h-[124px] w-full overflow-hidden rounded-xl border border-black/5 bg-[#f4f1ea] p-3">
          <div className="h-2 w-20 rounded-full bg-[#e9f5ee]" />
          <div className="mt-3 flex gap-2.5">
            <div className="h-16 w-[42%] rounded-lg bg-muted/80" style={{ backgroundColor: `${primary}22` }} />
            <div className="flex flex-1 flex-col gap-1 pt-0.5">
              <div className="h-2.5 w-full rounded-full bg-secondary/60" style={{ backgroundColor: secondary }} />
              <div className="h-1.5 w-4/5 rounded bg-muted" />
              <div className="mt-1.5 h-4 w-16 rounded-full" style={{ backgroundColor: primary }} />
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className="h-6 flex-1 rounded-lg border border-dashed border-black/10" style={{ backgroundColor: surface }} />
            <div className="h-6 flex-1 rounded-lg border border-dashed border-black/10" style={{ backgroundColor: surface }} />
            <div className="h-6 flex-1 rounded-lg border border-dashed border-black/10" style={{ backgroundColor: surface }} />
          </div>
        </div>
      )
    case "premium":
      return (
        <div className="relative h-[124px] w-full overflow-hidden rounded-xl border border-black/10 bg-zinc-100">
          <div className="h-9 w-full bg-zinc-900" />
          <div className="absolute left-1/2 top-4 w-[88%] -translate-x-1/2 space-y-1.5">
            <div className="mx-auto h-2.5 w-3/4 rounded-full bg-white/90" />
            <div className="mx-auto h-1.5 w-1/2 rounded" style={{ backgroundColor: primary }} />
            <div className="mx-auto mt-1 h-4 w-16 rounded-full" style={{ backgroundColor: primary }} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 top-[56px] bg-[#f5f0e6] px-3 pt-2.5">
            <div className="flex gap-2.5">
              <div className="flex-1 space-y-1">
                <div className="h-2 w-20 rounded-full bg-zinc-800" />
                <div className="h-1 w-full rounded bg-zinc-400/60" />
                <div className="h-1 w-4/5 rounded bg-zinc-400/40" />
              </div>
              <div className="h-12 w-14 rounded-lg border border-black/10 bg-white shadow-sm" />
            </div>
          </div>
        </div>
      )
    case "community":
      return (
        <div className="relative h-[124px] w-full overflow-hidden rounded-xl border border-black/5 bg-[#fefae0] p-3">
          <div
            className="mx-auto rounded-xl border border-black/5 px-4 py-3 text-center"
            style={{ backgroundColor: surface }}
          >
            <div className="mx-auto h-2.5 w-4/5 rounded-full bg-[#3d405b]/30" />
            <div className="mx-auto mt-1 h-1.5 w-3/5 rounded bg-muted" />
            <div className="mx-auto mt-2 h-5 w-20 rounded-full" style={{ backgroundColor: primary }} />
          </div>
          <div className="mt-2.5 flex gap-1.5">
            <div className="h-11 flex-1 rounded-lg border border-black/5" style={{ backgroundColor: `${primary}22` }} />
            <div className="h-11 flex-1 rounded-lg border border-black/5" style={{ backgroundColor: `${primary}18` }} />
          </div>
        </div>
      )
    case "sports":
      return (
        <div className="relative h-[124px] w-full overflow-hidden rounded-xl border border-black/10 bg-sky-50">
          <div className="flex h-6 w-full items-center justify-around gap-1 px-2" style={{ backgroundColor: primary }}>
            <div className="h-1 w-8 rounded bg-white/90" />
            <div className="h-1 w-8 rounded bg-white/90" />
            <div className="h-1 w-8 rounded bg-white/90" />
          </div>
          <div className="flex gap-2.5 p-3">
            <div className="h-14 w-[45%] rounded-lg bg-sky-200/80" />
            <div className="flex flex-1 flex-col gap-1 pt-0.5">
              <div className="h-2.5 w-full rounded bg-sky-900/80" />
              <div className="h-1.5 w-4/5 rounded bg-sky-600/50" />
              <div className="mt-1 h-4 w-14 rounded-full" style={{ backgroundColor: "#f97316" }} />
            </div>
          </div>
          <div className="px-3 pb-3">
            <div className="h-1 w-full rounded bg-orange-400/50" />
          </div>
        </div>
      )
  }
}

export function TemplatePreviewCard({
  meta,
  className,
  footer,
}: {
  meta: LandingMeta
  className?: string
  footer: React.ReactNode
}) {
  const preview = meta.preview
  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        preview === "montessori" && "border-emerald-900/10",
        preview === "premium" && "border-amber-900/15",
        preview === "community" && "border-orange-300/30",
        preview === "sports" && "border-blue-300/35",
        className,
      )}
    >
      <div className="relative h-1.5 w-full shrink-0 overflow-hidden">
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
      <CardHeader className="space-y-2 pb-2.5">
        <p className="text-muted-foreground max-w-[95%] text-[11px] font-semibold uppercase tracking-[0.14em]">{meta.tagline}</p>
        <CardTitle className="text-xl leading-tight tracking-tight">{meta.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm leading-relaxed">{meta.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <MiniPreview variant={preview} primary={meta.primary} secondary={meta.secondary} surface={THEMES_SURFACE[preview]} />
      </CardContent>
      <CardFooter className="mt-auto flex flex-col gap-3 border-t bg-muted/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
        {footer}
      </CardFooter>
    </Card>
  )
}

/** Theme surface tints for mini wireframe (matches presets) */
const THEMES_SURFACE: Record<LandingMeta["preview"], string> = {
  montessori: "#e9f5ee",
  premium: "#f5f0e6",
  community: "#faedcd",
  sports: "#dbeafe",
}
