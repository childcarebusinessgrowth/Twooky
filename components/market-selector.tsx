"use client"

import { useRouter } from "next/navigation"
import { Check, ChevronDown, Globe, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MarketId } from "@/lib/market"
import type { MarketOption } from "@/lib/market-options"
import { cn } from "@/lib/utils"

type MarketSelectorProps = {
  initialMarket: MarketId
  marketOptions: MarketOption[]
}

export function MarketSelector({ initialMarket, marketOptions }: MarketSelectorProps) {
  const router = useRouter()
  const [pendingMarket, setPendingMarket] = useState<MarketId | null>(null)
  const selected = marketOptions.find((option) => option.id === initialMarket)
  const selectedId = selected?.id ?? initialMarket
  const triggerLabel = selected?.label ?? "Choose country"

  const marketMeta: Record<MarketId, { code: string }> = {
    global: { code: "GL" },
    uk: { code: "UK" },
    us: { code: "US" },
    uae: { code: "UAE" },
  }

  async function setMarket(market: MarketId) {
    if (market === initialMarket || pendingMarket) return

    setPendingMarket(market)
    try {
      await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market }),
      })
      router.refresh()
    } finally {
      setPendingMarket(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Selected country: ${triggerLabel}. Open country picker`}
          disabled={pendingMarket !== null}
          className={cn(
            "h-9 gap-2 rounded-xl border-border/80 bg-background px-3 text-foreground shadow-xs transition-all",
            "hover:border-primary/40 hover:bg-accent/40 hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          {pendingMarket ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
          ) : (
            <Globe className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          )}
          <span className="max-w-36 truncate text-sm font-semibold">
            {triggerLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-xl p-1.5">
        {marketOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => void setMarket(option.id)}
            disabled={pendingMarket !== null}
            className={cn(
              "group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5",
              "focus:bg-primary/10 data-disabled:cursor-not-allowed data-disabled:opacity-70",
              option.id === initialMarket && "bg-primary/8",
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <p
                className={cn(
                  "truncate text-sm",
                  option.id === initialMarket ? "font-semibold text-primary" : "text-foreground",
                )}
              >
                {option.label}
              </p>
              <span className="rounded-md border border-border/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                {marketMeta[option.id]?.code ?? option.id.toUpperCase()}
              </span>
            </div>
            {pendingMarket === option.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
            ) : option.id === initialMarket ? (
              <Check className="h-4 w-4 text-primary" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
