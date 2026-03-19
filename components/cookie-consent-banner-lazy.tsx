"use client"

import dynamic from "next/dynamic"

const CookieConsentBanner = dynamic(
  () =>
    import("@/components/cookie-consent-banner").then((m) => ({
      default: m.CookieConsentBanner,
    })),
  { ssr: false }
)

export function CookieConsentBannerLazy() {
  return <CookieConsentBanner />
}
