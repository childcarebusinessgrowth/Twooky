import "server-only"

const DEFAULT_SITE_URL = "http://localhost:3000"

export type SitemapUrlEntry = {
  loc: string
  lastmod?: string | Date | null
}

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, "")
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL
  return normalizeSiteUrl(raw)
}

export function toAbsoluteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`
  return `${getSiteUrl()}${path}`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function formatLastmod(value?: string | Date | null): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const asDate = new Date(value)
  return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString()
}

export function buildUrlSetXml(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const loc = escapeXml(entry.loc)
      const lastmod = formatLastmod(entry.lastmod)
      return lastmod
        ? `<url><loc>${loc}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`
        : `<url><loc>${loc}</loc></url>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export function buildSitemapIndexXml(entries: SitemapUrlEntry[]): string {
  const body = entries
    .map((entry) => {
      const loc = escapeXml(entry.loc)
      const lastmod = formatLastmod(entry.lastmod)
      return lastmod
        ? `<sitemap><loc>${loc}</loc><lastmod>${escapeXml(lastmod)}</lastmod></sitemap>`
        : `<sitemap><loc>${loc}</loc></sitemap>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  })
}
