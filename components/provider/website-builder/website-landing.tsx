"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  applyProviderWebsiteTemplate,
  createProviderWebsite,
  loadProviderWebsiteState,
} from "@/app/dashboard/provider/website/actions"
import { TEMPLATE_KEYS, TEMPLATE_LANDING, type TemplateKey } from "@/lib/website-builder/templates/presets"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { TemplatePreviewCard } from "@/components/provider/website-builder/template-preview-card"
import { toast } from "sonner"
import { ArrowRight, CheckCircle2, HeartHandshake, LayoutTemplate, Loader2, Pencil } from "lucide-react"

export default function WebsiteLanding() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [hasSite, setHasSite] = useState(false)
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [templateReplaceConfirm, setTemplateReplaceConfirm] = useState<TemplateKey | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await loadProviderWebsiteState()
      if (cancelled) return
      if ("error" in res) {
        toast.error(res.error)
        setLoading(false)
        return
      }
      setHasSite(!!res.state)
      setSubdomain(res.state?.website.subdomain_slug ?? null)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function goToEditorAfter(fn: () => Promise<{ error: string } | { ok: true }>, busyKey: string) {
    setBusy(busyKey)
    try {
      const r = await fn()
      if ("error" in r) {
        toast.error(r.error)
        return
      }
      router.push("/dashboard/provider/website/build")
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        Loading…
      </div>
    )
  }

  const pendingTemplateTitle =
    templateReplaceConfirm != null ? TEMPLATE_LANDING[templateReplaceConfirm].title : ""

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <AlertDialog
        open={templateReplaceConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setTemplateReplaceConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to the {pendingTemplateTitle} template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all of your current pages, layout, and styles with the {pendingTemplateTitle} preset.
              Your previous draft content will be lost. You can still edit everything again in the builder after
              switching.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const key = templateReplaceConfirm
                if (!key) return
                void goToEditorAfter(async () => applyProviderWebsiteTemplate(key), key)
              }}
            >
              Replace with template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-background via-background to-primary/5 px-5 py-7 shadow-sm sm:px-8">
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-4">
            <div className="text-primary inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium">
              <LayoutTemplate className="h-4 w-4" />
              Parent-ready website templates
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Build a warm, trustworthy first impression for families
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
              Start with a professionally written childcare template, then personalize photos, programs, and details in
              minutes. Every template includes Home, About, Programs, Fees, Gallery, and Contact pages.
            </p>
            {hasSite && subdomain && (
              <p className="text-muted-foreground rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm">
                Your current site is <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{subdomain}</code>. You
                can keep editing it or switch templates below.
              </p>
            )}
            <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              {hasSite ? (
                <Button asChild size="lg" className="gap-2 sm:min-w-[250px]">
                  <Link href="/dashboard/provider/website/build">
                    <Pencil className="h-4 w-4" />
                    Open website editor
                    <ArrowRight className="h-4 w-4 opacity-80" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="default"
                  className="gap-2 sm:min-w-[250px]"
                  disabled={busy !== null}
                  onClick={() =>
                    goToEditorAfter(async () => createProviderWebsite("blank"), "blank")
                  }
                >
                  {busy === "blank" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LayoutTemplate className="h-4 w-4" />
                  )}
                  Build from blank canvas
                  <ArrowRight className="h-4 w-4 opacity-80" />
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard/provider">Back to dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold">What families care about most</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Clear daily routine, safety communication, and responsive contact details.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Warm tone and parent-friendly language across every starter page.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Strong “book a tour” calls-to-action to support enquiries.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold tracking-tight">Choose your website style</h2>
          <p className="text-muted-foreground text-sm">
            Pick the visual personality that best fits your nursery. You can edit every section after selecting.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {TEMPLATE_KEYS.map((key) => {
            const t = TEMPLATE_LANDING[key]
            return (
              <TemplatePreviewCard
                key={key}
                meta={t}
                className="h-full"
                footer={
                  <Button
                    className="w-full min-w-[200px] sm:ml-auto"
                    variant={hasSite ? "outline" : "secondary"}
                    disabled={busy !== null}
                    onClick={() => {
                      if (hasSite) {
                        setTemplateReplaceConfirm(key)
                        return
                      }
                      void goToEditorAfter(async () => createProviderWebsite(key), key)
                    }}
                  >
                    {busy === key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : hasSite ? (
                      "Switch to this template"
                    ) : (
                      "Use this template"
                    )}
                  </Button>
                }
              />
            )
          })}
        </div>
      </div>

      {!hasSite && (
        <p className="text-muted-foreground text-center text-sm sm:text-left">
          Want total flexibility? Start from a blank canvas and build each section your own way.
        </p>
      )}
    </div>
  )
}
