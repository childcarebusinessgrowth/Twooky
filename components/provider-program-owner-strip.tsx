"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"

type ProviderProgramOwnerStripProps = {
  isVisible: boolean
  claimHref?: string
  signupHref?: string
}

export function ProviderProgramOwnerStrip({
  isVisible,
  claimHref = "/claim-listing",
  signupHref = "/signup?role=provider",
}: ProviderProgramOwnerStripProps) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch("/api/auth/role", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { role?: string } | null) => {
        if (!cancelled && data?.role === "provider") {
          setHidden(true)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!isVisible || hidden) {
    return null
  }

  return (
    <div className="mb-4 rounded-2xl border border-primary/15 bg-linear-to-r from-primary/10 via-background to-secondary/10 shadow-sm">
      <div className="flex flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Is this your program?</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Claim this profile to manage photos, hours, and inquiries. If you are new to Twooky,
              sign up as a provider.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="sm" asChild>
            <Link href={claimHref}>
              Claim profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={signupHref}>Sign up</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
