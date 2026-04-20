"use client"

import { useRouter } from "next/navigation"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MarketId } from "@/lib/market"
import type { MarketOption } from "@/lib/market-options"

type MarketSelectorProps = {
  initialMarket: MarketId
  marketOptions: MarketOption[]
}

export function MarketSelector({ initialMarket, marketOptions }: MarketSelectorProps) {
  const router = useRouter()
  const selected = marketOptions.find((option) => option.id === initialMarket)

  async function setMarket(market: MarketId) {
    await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ market }),
    })
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Globe className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline max-w-36 truncate">
            {selected?.label ?? "Pick country"}
          </span>
          <span className="sm:hidden">Region</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {marketOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => void setMarket(option.id)}
            className={option.id === initialMarket ? "font-semibold text-primary" : undefined}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
