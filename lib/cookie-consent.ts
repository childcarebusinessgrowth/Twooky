/**
 * Client-side cookie consent for Essential + Analytics categories.
 * Used by the banner and analytics gate; safe to import from client components only for document access.
 */

export const COOKIE_CONSENT_COOKIE_NAME = "eld_cookie_consent"
export const COOKIE_CONSENT_VERSION = 1
export const COOKIE_CONSENT_UPDATED_EVENT = "eld_cookie_consent_updated"

export type CookieConsentState = {
  version: number
  essential: true
  analytics: boolean
}

const MAX_AGE_SECONDS = 60 * 60 * 24 * 365

/**
 * Parse consent from a raw `document.cookie` string (or any `Cookie` header style string).
 */
export function parseConsentCookie(cookieString: string | undefined | null): CookieConsentState | null {
  if (!cookieString) return null
  const escapedName = COOKIE_CONSENT_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`))
  if (!match?.[1]) return null
  try {
    const decoded = decodeURIComponent(match[1].trim())
    const parsed = JSON.parse(decoded) as Partial<CookieConsentState>
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null
    if (parsed.analytics !== true && parsed.analytics !== false) return null
    return {
      version: COOKIE_CONSENT_VERSION,
      essential: true,
      analytics: parsed.analytics,
    }
  } catch {
    return null
  }
}

export function readConsentFromDocument(): CookieConsentState | null {
  if (typeof document === "undefined") return null
  return parseConsentCookie(document.cookie)
}

export function writeConsentCookie(analytics: boolean): void {
  if (typeof document === "undefined") return
  const payload: CookieConsentState = {
    version: COOKIE_CONSENT_VERSION,
    essential: true,
    analytics,
  }
  const value = encodeURIComponent(JSON.stringify(payload))
  const secure =
    typeof window !== "undefined" && window.location?.protocol === "https:"
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${value}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure ? "; Secure" : ""}`
}

export function dispatchConsentUpdated(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT))
}
