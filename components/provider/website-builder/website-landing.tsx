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
import { ArrowRight, LayoutTemplate, Loader2, Pencil } from "lucide-react"

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
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
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
      <div className="space-y-3 text-center sm:text-left">
        <div className="text-primary inline-flex items-center gap-2 text-sm font-medium">
          <LayoutTemplate className="h-4 w-4" />
          Your nursery website
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Choose a template or build your own</h1>
        <p className="text-muted-foreground max-w-2xl text-base">
          Pick a childcare-ready layout (Home, About, Programs, Fees, Gallery, Contact), then customize text, colours,
          images, and pages. Publish to your free subdomain when you are ready.
        </p>
        {hasSite && subdomain && (
          <p className="text-muted-foreground text-sm">
            You already have a site (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{subdomain}</code>
            ). Open the editor anytime, or switch template below (replaces current pages).
          </p>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {hasSite ? (
          <Button asChild size="lg" className="gap-2 sm:min-w-[240px]">
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
            className="gap-2 sm:min-w-[240px]"
            disabled={busy !== null}
            onClick={() =>
              goToEditorAfter(async () => createProviderWebsite("blank"), "blank")
            }
          >
            {busy === "blank" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutTemplate className="h-4 w-4" />}
            Build from blank canvas
            <ArrowRight className="h-4 w-4 opacity-80" />
          </Button>
        )}
        <Button variant="outline" size="lg" asChild>
          <Link href="/dashboard/provider">Back to dashboard</Link>
        </Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Childcare templates</h2>
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
          Prefer full control? Use <strong>Build from blank canvas</strong>, then add pages and blocks in the editor.
        </p>
      )}
    </div>
  )
}
