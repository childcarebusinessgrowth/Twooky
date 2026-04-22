import {
  buildLocationHref,
  getActiveLocationRouteParams,
} from "@/lib/locations"
import { getProviderTypes } from "@/lib/provider-taxonomy"
import { buildUrlSetXml, toAbsoluteUrl, xmlResponse } from "@/lib/sitemap"

export const revalidate = 3600

export async function GET(): Promise<Response> {
  const now = new Date().toISOString()
  let routes: Awaited<ReturnType<typeof getActiveLocationRouteParams>>
  let providerTypes: Awaited<ReturnType<typeof getProviderTypes>>
  try {
    ;[routes, providerTypes] = await Promise.all([getActiveLocationRouteParams(), getProviderTypes()])
  } catch (e) {
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.warn("[sitemap:locations] Skipped in CI:", e)
      return xmlResponse(buildUrlSetXml([]))
    }
    throw e
  }

  const entries = [
    ...routes.map((route) => ({
      loc: toAbsoluteUrl(buildLocationHref(route.country, route.city)),
      lastmod: now,
    })),
    ...providerTypes.map((type) => ({
      loc: toAbsoluteUrl(`/${type.slug}`),
      lastmod: now,
    })),
  ]
  return xmlResponse(buildUrlSetXml(entries))
}
