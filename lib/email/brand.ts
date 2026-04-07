/** Align with app/globals.css marketing tokens for transactional email. */
export const BRAND_PRIMARY = "#203e68"
export const BRAND_SECONDARY = "#F9BB11"
export const BRAND_TERTIARY = "#0ba5aa"
export const BRAND_MUTED = "#64748b"
export const BRAND_BACKGROUND = "#f8fafc"

export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (raw) {
    try {
      return new URL(raw).origin
    } catch {
      // ignore invalid URL
    }
  }
  return "http://localhost:3000"
}

export function absoluteUrl(path: string): string {
  const base = getSiteOrigin().replace(/\/$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}
