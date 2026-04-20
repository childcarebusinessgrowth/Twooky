"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import type { MarketId } from "@/lib/market"

const DASHBOARD_PREFIXES = ["/dashboard", "/admin", "/parents"] as const

interface ConditionalChromeProps {
  position: "top" | "bottom"
  /** Rendered on the server and passed as a slot so the footer stays out of the client bundle. */
  footer?: ReactNode
  initialMarket: MarketId
}

export function ConditionalChrome({ position, footer, initialMarket }: ConditionalChromeProps) {
  const pathname = usePathname()

  const shouldHideChrome = DASHBOARD_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (shouldHideChrome) {
    return null
  }

  if (position === "top") {
    return <Header initialMarket={initialMarket} />
  }

  return <>{footer ?? null}</>
}
