import { PROVIDER_TYPES } from "@/lib/provider-types"
import {
  buildLocationHref,
  buildLocationProviderTypeHref,
  getActiveLocationRouteParams,
} from "@/lib/locations"
import { buildUrlSetXml, toAbsoluteUrl, xmlResponse } from "@/lib/sitemap"

export const revalidate = 3600

export async function GET(): Promise<Response> {
  const now = new Date().toISOString()
  const routes = await getActiveLocationRouteParams()

  const entries = routes.flatMap((route) => {
    const cityUrl = {
      loc: toAbsoluteUrl(buildLocationHref(route.country, route.city)),
      lastmod: now,
    }
    const providerTypeUrls = PROVIDER_TYPES.map((type) => ({
      loc: toAbsoluteUrl(buildLocationProviderTypeHref(route.country, route.city, type.id)),
      lastmod: now,
    }))
    return [cityUrl, ...providerTypeUrls]
  })

  return xmlResponse(buildUrlSetXml(entries))
}
