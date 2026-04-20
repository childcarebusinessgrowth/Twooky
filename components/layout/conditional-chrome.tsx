"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import type { MarketId } from "@/lib/market"
import type { MarketOption } from "@/lib/market-options"

const DASHBOARD_PREFIXES = ["/dashboard", "/admin", "/parents"] as const

interface ConditionalChromeProps {
  position: "top" | "bottom"
  /** Rendered on the server and passed as a slot so the footer stays out of the client bundle. */
  footer?: ReactNode
  initialMarket: MarketId
  marketOptions: MarketOption[]
}

export function ConditionalChrome({
  position,
  footer,
  initialMarket,
  marketOptions,
}: ConditionalChromeProps) {
  const pathname = usePathname()

  const shouldHideChrome = DASHBOARD_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (shouldHideChrome) {
    return null
  }

  if (position === "top") {
    return <Header initialMarket={initialMarket} marketOptions={marketOptions} />
  }

  return <>{footer ?? null}</>
}
