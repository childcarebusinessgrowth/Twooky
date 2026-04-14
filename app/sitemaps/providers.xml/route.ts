import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { buildUrlSetXml, toAbsoluteUrl, xmlResponse } from "@/lib/sitemap"

export const revalidate = 3600

type ProviderSlugRow = {
  provider_slug: string | null
}

export async function GET(): Promise<Response> {
  const supabase = getSupabaseAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("provider_profiles")
    .select("provider_slug")
    .eq("listing_status", "active")
    .not("provider_slug", "is", null)
    .returns<ProviderSlugRow[]>()

  if (error) {
    console.error("[sitemap:providers] Failed to load provider slugs", error.message)
    return xmlResponse(buildUrlSetXml([]))
  }

  const entries = (data ?? [])
    .map((row) => row.provider_slug?.trim())
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({
      loc: toAbsoluteUrl(`/providers/${slug}`),
      lastmod: now,
    }))

  return xmlResponse(buildUrlSetXml(entries))
}
