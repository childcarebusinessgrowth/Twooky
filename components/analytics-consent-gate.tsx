"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  readConsentFromDocument,
} from "@/lib/cookie-consent"

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((mod) => mod.Analytics),
  { ssr: false },
)

export function AnalyticsConsentGate() {
  const [allowAnalytics, setAllowAnalytics] = useState(false)

  useEffect(() => {
    const sync = () => {
      const consent = readConsentFromDocument()
      setAllowAnalytics(consent?.analytics === true)
    }
    sync()
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, sync)
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, sync)
  }, [])

  if (!allowAnalytics) return null

  return <Analytics />
}
