"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutDashboard } from "lucide-react"

export function ProviderProgramOwnerStrip() {
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

  if (hidden) {
    return null
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-muted/60 shadow-sm">
      <div className="flex flex-col items-start gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <p className="flex items-start gap-2 text-sm text-foreground">
          <LayoutDashboard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            Is this your program? Manage your listing, photos, and inquiries on Twooky.
          </span>
        </p>
        <Link
          href="/for-providers"
          className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          For providers
        </Link>
      </div>
    </div>
  )
}
