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

/**
 * Supabase `redirect_to` for password recovery emails. Must match an entry in
 * Supabase Dashboard → Authentication → URL configuration → Redirect URLs.
 * Set PASSWORD_RESET_REDIRECT_URL if it must differ from `${origin}/update-password`.
 */
export function getPasswordResetRedirectUrl(): string {
  const explicit = process.env.PASSWORD_RESET_REDIRECT_URL?.trim()
  if (explicit) {
    try {
      const u = new URL(explicit)
      return u.href.replace(/\/$/, "")
    } catch {
      return explicit.replace(/\/$/, "")
    }
  }
  return `${getSiteOrigin().replace(/\/$/, "")}/update-password`
}
