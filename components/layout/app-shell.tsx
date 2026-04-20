"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { BackToTopButton } from "@/components/layout/back-to-top-button"
import type { MarketId } from "@/lib/market"
import type { MarketOption } from "@/lib/market-options"

const DASHBOARD_PREFIXES = ["/dashboard", "/admin", "/parents", "/site"]

interface AppShellProps {
  children: ReactNode
  footer: ReactNode
  initialMarket: MarketId
  marketOptions: MarketOption[]
}

export function AppShell({ children, footer, initialMarket, marketOptions }: AppShellProps) {
  const pathname = usePathname()

  const shouldHideChrome = DASHBOARD_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (shouldHideChrome) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <>
      <Header initialMarket={initialMarket} marketOptions={marketOptions} />
      <main className="flex-1">
        {children}
      </main>
      {footer}
      <BackToTopButton />
    </>
  )
}

