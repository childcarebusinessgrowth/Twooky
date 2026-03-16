"use client"

import { useEffect, useRef } from "react"

export function ProviderProfileViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false)

  useEffect(() => {
    if (!slug || sent.current) return
    sent.current = true
    fetch("/api/provider-profile-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
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
  }, [slug])

  return null
}
