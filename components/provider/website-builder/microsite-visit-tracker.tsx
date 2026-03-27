"use client"

import { useEffect, useRef } from "react"
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  readConsentFromDocument,
} from "@/lib/cookie-consent"

type MicrositeVisitTrackerProps = {
  subdomain: string
  pageSlug: string
}

export function MicrositeVisitTracker({ subdomain, pageSlug }: MicrositeVisitTrackerProps) {
  const sent = useRef(false)

  useEffect(() => {
    const normalizedSubdomain = subdomain.trim().toLowerCase()
    if (!normalizedSubdomain) return

    const trySend = () => {
      if (sent.current) return
      const consent = readConsentFromDocument()
      if (consent?.analytics !== true) return

      sent.current = true
      fetch("/api/provider-website-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: normalizedSubdomain, pageSlug }),
        keepalive: true,
      })
        .then((res) => {
          if (!res.ok) sent.current = false
        })
        .catch(() => {
          sent.current = false
        })
    }

    trySend()
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, trySend)
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, trySend)
  }, [subdomain, pageSlug])

  return null
}
