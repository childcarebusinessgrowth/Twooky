import { getActiveProgramTypes } from "@/lib/program-types"
import { buildUrlSetXml, toAbsoluteUrl, xmlResponse } from "@/lib/sitemap"

export const revalidate = 3600

export async function GET(): Promise<Response> {
  const now = new Date().toISOString()
  const rows = await getActiveProgramTypes()

  const entries = rows
    .map((row) => row.slug?.trim())
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({
      loc: toAbsoluteUrl(`/programs/${slug}`),
      lastmod: now,
    }))

  return xmlResponse(buildUrlSetXml(entries))
}
