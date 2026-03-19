"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"

const DASHBOARD_PREFIXES = ["/dashboard", "/admin", "/parents"] as const

interface ConditionalChromeProps {
  position: "top" | "bottom"
  /** Rendered on the server and passed as a slot so the footer stays out of the client bundle. */
  footer?: ReactNode
}

export function ConditionalChrome({ position, footer }: ConditionalChromeProps) {
  const pathname = usePathname()

  const shouldHideChrome = DASHBOARD_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (shouldHideChrome) {
    return null
  }

  if (position === "top") {
    return <Header />
  }

  return <>{footer ?? null}</>
}
