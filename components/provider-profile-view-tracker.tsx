"use client"

import { useEffect, useRef } from "react"
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  readConsentFromDocument,
} from "@/lib/cookie-consent"

export function ProviderProfileViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false)

  useEffect(() => {
    const normalizedSlug = slug.trim().toLowerCase()
    if (!normalizedSlug) return

    const trySend = () => {
      if (sent.current) return
      const consent = readConsentFromDocument()
      if (consent?.analytics !== true) return

      sent.current = true
      fetch("/api/provider-profile-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: normalizedSlug }),
        keepalive: true,
      })
        .then((res) => {
          if (!res.ok) {
            sent.current = false
          }
        })
        .catch(() => {
          sent.current = false
        })
    }

    trySend()
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, trySend)
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, trySend)
  }, [slug])

  return null
}
