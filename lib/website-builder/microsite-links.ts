/** Internal path or absolute URL for microsite nav / buttons. */
export function resolveMicrositeHref(path: string, siteBase: string): string {
  const t = path.trim()
  if (!t) return siteBase
  const lower = t.toLowerCase()
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) return t
  return `${siteBase}/${t.replace(/^\/+/, "")}`
}
