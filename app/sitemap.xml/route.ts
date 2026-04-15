import { buildSitemapIndexXml, toAbsoluteUrl, xmlResponse } from "@/lib/sitemap"

export const revalidate = 3600

export async function GET(): Promise<Response> {
  const now = new Date().toISOString()
  const xml = buildSitemapIndexXml([
    { loc: toAbsoluteUrl("/sitemaps/providers.xml"), lastmod: now },
    { loc: toAbsoluteUrl("/sitemaps/locations.xml"), lastmod: now },
    { loc: toAbsoluteUrl("/sitemaps/programs.xml"), lastmod: now },
    { loc: toAbsoluteUrl("/sitemaps/microsites.xml"), lastmod: now },
    { loc: toAbsoluteUrl("/sitemaps/microsite-blog.xml"), lastmod: now },
  ])

  return xmlResponse(xml)
}
