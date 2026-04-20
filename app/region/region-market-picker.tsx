"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { MarketId, SelectableMarketId } from "@/lib/market"
import { MARKET_IDS } from "@/lib/market"
import { getMarketCopy } from "@/lib/market-copy"

const FLAGS: Record<SelectableMarketId, string> = {
  uk: "🇬🇧",
  us: "🇺🇸",
  uae: "🇦🇪",
}

export function RegionMarketPicker({ current }: { current: MarketId }) {
  const router = useRouter()
  const [pending, setPending] = useState<MarketId | null>(null)

  async function choose(market: MarketId) {
    setPending(market)
    try {
      await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market }),
      })
      router.refresh()
      router.push("/")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {MARKET_IDS.map((id) => {
        const copy = getMarketCopy(id)
        const active = id === current
        return (
          <div
            key={id}
            className={`flex flex-col rounded-2xl border p-6 shadow-sm transition-colors ${
              active ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            <div className="text-3xl mb-2" aria-hidden>
              {FLAGS[id]}
            </div>
            <h2 className="text-lg font-semibold text-foreground">{copy.label}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
              {copy.mainCareTerm} · {copy.currency}
            </p>
            <Button
              className="mt-4 w-full"
              variant={active ? "secondary" : "default"}
              disabled={pending !== null || active}
              onClick={() => void choose(id)}
            >
              {pending === id ? "Saving…" : active ? "Selected" : "Use this region"}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
