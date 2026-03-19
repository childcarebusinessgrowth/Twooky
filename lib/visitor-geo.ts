/**
 * Visitor geolocation parsed from CDN / edge headers (no extra IP API call on Vercel).
 * Local `next dev` usually has no headers → callers should treat as unknown and fall back.
 */

export type VisitorGeo = {
  city: string | null
  countryCode: string | null
  latitude: number | null
  longitude: number | null
}

function safeDecodeCity(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const t = raw.trim()
  try {
    const decoded = decodeURIComponent(t.replace(/\+/g, " "))
    return decoded.trim() || null
  } catch {
    return t
  }
}

function parseCoord(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null
  const n = Number.parseFloat(raw.trim())
  return Number.isFinite(n) ? n : null
}

function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const c = raw.trim().toUpperCase()
  if (c.length === 2 && /^[A-Z]{2}$/.test(c)) return c
  return null
}

/**
 * Returns a structured geo object when at least one usable signal exists; otherwise null.
 * Priority: Vercel headers, then Cloudflare request headers.
 */
export function parseVisitorGeoFromHeaders(headers: Headers): VisitorGeo | null {
  const city =
    safeDecodeCity(headers.get("x-vercel-ip-city")) ??
    safeDecodeCity(headers.get("cf-ipcity"))

  const countryCode =
    normalizeCountryCode(headers.get("x-vercel-ip-country")) ??
    normalizeCountryCode(headers.get("cf-ipcountry"))

  const latitude =
    parseCoord(headers.get("x-vercel-ip-latitude")) ?? parseCoord(headers.get("cf-iplatitude"))

  const longitude =
    parseCoord(headers.get("x-vercel-ip-longitude")) ?? parseCoord(headers.get("cf-iplongitude"))

  if (!city && !countryCode && latitude === null && longitude === null) {
    return null
  }

  return {
    city,
    countryCode,
    latitude,
    longitude,
  }
}

/**
 * True when we can attempt distance-based matching (both coordinates valid).
 */
export function visitorHasLatLng(geo: VisitorGeo): boolean {
  return (
    geo.latitude !== null &&
    geo.longitude !== null &&
    Number.isFinite(geo.latitude) &&
    Number.isFinite(geo.longitude)
  )
}
