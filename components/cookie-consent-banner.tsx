"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  dispatchConsentUpdated,
  readConsentFromDocument,
  writeConsentCookie,
} from "@/lib/cookie-consent"

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    setMounted(true)
    const consent = readConsentFromDocument()
    setShowBanner(consent === null)
  }, [])

  useEffect(() => {
    if (!settingsOpen) return
    const consent = readConsentFromDocument()
    setAnalyticsEnabled(consent?.analytics ?? false)
  }, [settingsOpen])

  const applyConsent = (analytics: boolean) => {
    writeConsentCookie(analytics)
    dispatchConsentUpdated()
    setShowBanner(false)
    setSettingsOpen(false)
  }

  useEffect(() => {
    const onUpdated = () => {
      const consent = readConsentFromDocument()
      setShowBanner(consent === null)
    }
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdated)
  }, [])

  if (!mounted || !showBanner) return null

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 p-4 sm:p-5 md:p-6",
          "pointer-events-none",
        )}
        role="region"
        aria-label="Cookie consent"
      >
        <div
          className={cn(
            "pointer-events-auto mx-auto max-w-3xl",
            "rounded-2xl border border-border/80 bg-card/95 shadow-xl backdrop-blur-md",
            "ring-1 ring-black/5 dark:ring-white/10",
          )}
        >
          <div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-start md:gap-6">
            <div className="flex shrink-0 justify-center md:pt-0.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cookie className="h-5 w-5" aria-hidden />
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                We value your privacy
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We use essential cookies to run the site (for example, keeping you signed in). With
                your permission, we also use analytics cookies to understand how visitors use Early
                Learning Directory so we can improve it. Read our{" "}
                <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>{" "}
                for more detail.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <Button type="button" size="default" onClick={() => applyConsent(true)} className="w-full sm:w-auto">
                  Accept analytics
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => applyConsent(false)}
                  className="w-full sm:w-auto"
                >
                  Reject analytics
                </Button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline sm:text-left"
                >
                  Cookie settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription id="cookie-settings-desc">
              Essential cookies are always on. You can choose whether to allow analytics cookies.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Essential</p>
                <p className="text-xs text-muted-foreground">
                  Required for security, sign-in, and core features.
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">Always on</span>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-1 pr-2">
                <p className="text-sm font-medium text-foreground">Analytics</p>
                <p className="text-xs text-muted-foreground">
                  Helps us measure traffic and improve the product (e.g. Vercel Web Analytics).
                </p>
              </div>
              <Switch
                checked={analyticsEnabled}
                onCheckedChange={setAnalyticsEnabled}
                aria-label="Allow analytics cookies"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => applyConsent(analyticsEnabled)}>
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
