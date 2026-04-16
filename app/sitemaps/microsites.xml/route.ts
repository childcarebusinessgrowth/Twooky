import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { buildUrlSetXml, xmlResponse } from "@/lib/sitemap"
import { buildMicrositeUrl, pagePathnameFromSlug } from "@/lib/website-builder/microsite-seo"
import { parsePublishedSnapshot } from "@/lib/website-builder/snapshot"

export const revalidate = 3600

type WebsiteRow = {
  id: string
  subdomain_slug: string
  updated_at: string
  published_version_id: string | null
}

type VersionRow = {
  id: string
  created_at: string
  snapshot: unknown
}

export async function GET(): Promise<Response> {
  let supabase: ReturnType<typeof getSupabaseAdminClient>
  try {
    supabase = getSupabaseAdminClient()
  } catch (e) {
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.warn("[sitemap:microsites] Skipped in CI:", e)
      return xmlResponse(buildUrlSetXml([]))
    }
    throw e
  }
  const { data: websites, error: websitesError } = await supabase
    .from("provider_websites")
    .select("id, subdomain_slug, updated_at, published_version_id")
    .not("published_version_id", "is", null)
    .returns<WebsiteRow[]>()

  if (websitesError || !websites?.length) {
    if (websitesError) {
      console.error("[sitemap:microsites] Failed to load websites", websitesError.message)
    }
    return xmlResponse(buildUrlSetXml([]))
  }

  const versionIds = websites
    .map((website) => website.published_version_id)
    .filter((id): id is string => Boolean(id))

  const { data: versions, error: versionsError } = await supabase
    .from("provider_website_published_versions")
    .select("id, created_at, snapshot")
    .in("id", versionIds)
    .returns<VersionRow[]>()

  if (versionsError) {
    console.error("[sitemap:microsites] Failed to load versions", versionsError.message)
    return xmlResponse(buildUrlSetXml([]))
  }

  const versionById = new Map((versions ?? []).map((version) => [version.id, version]))
  const entries = new Map<string, { loc: string; lastmod?: string }>()

  for (const website of websites) {
    const version = website.published_version_id ? versionById.get(website.published_version_id) : null
    const snapshot = version ? parsePublishedSnapshot(version.snapshot) : null
    const lastmod = version?.created_at ?? website.updated_at

    if (!snapshot) {
      const loc = await buildMicrositeUrl(website.subdomain_slug)
      entries.set(loc, { loc, lastmod })
      continue
    }

    for (const page of snapshot.pages) {
      const loc = await buildMicrositeUrl(website.subdomain_slug, pagePathnameFromSlug(page.path_slug))
      entries.set(loc, { loc, lastmod })
    }
  }

  return xmlResponse(buildUrlSetXml([...entries.values()]))
}
