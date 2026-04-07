/**
 * Turns user-entered provider website values into absolute http(s) URLs for
 * storage and <a href>. Without a scheme, browsers treat values like
 * "www.example.com" as relative paths.
 */
export function normalizeProviderWebsiteUrl(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim()
  if (!t) return null
  const lower = t.toLowerCase()
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return null
  }
  if (/^https?:\/\//i.test(t)) return t
  if (t.startsWith("//")) return `https:${t}`
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t
  return `https://${t}`
}
