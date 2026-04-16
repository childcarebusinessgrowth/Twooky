import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { buildUrlSetXml, xmlResponse } from "@/lib/sitemap"
import { buildMicrositeUrl } from "@/lib/website-builder/microsite-seo"

export const revalidate = 3600

type WebsiteRow = {
  id: string
  subdomain_slug: string
}

type BlogPostRow = {
  provider_website_id: string
  slug: string
  published_at: string | null
  updated_at: string
}

export async function GET(): Promise<Response> {
  let supabase: ReturnType<typeof getSupabaseAdminClient>
  try {
    supabase = getSupabaseAdminClient()
  } catch (e) {
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.warn("[sitemap:microsite-blog] Skipped in CI:", e)
      return xmlResponse(buildUrlSetXml([]))
    }
    throw e
  }
  const { data: websites, error: websitesError } = await supabase
    .from("provider_websites")
    .select("id, subdomain_slug")
    .not("published_version_id", "is", null)
    .returns<WebsiteRow[]>()

  if (websitesError || !websites?.length) {
    if (websitesError) {
      console.error("[sitemap:microsite-blog] Failed to load websites", websitesError.message)
    }
    return xmlResponse(buildUrlSetXml([]))
  }

  const subdomainByWebsiteId = new Map(websites.map((website) => [website.id, website.subdomain_slug]))
  const websiteIds = [...subdomainByWebsiteId.keys()]

  const { data: posts, error: postsError } = await supabase
    .from("provider_blog_posts")
    .select("provider_website_id, slug, published_at, updated_at")
    .in("provider_website_id", websiteIds)
    .eq("status", "published")
    .returns<BlogPostRow[]>()

  if (postsError) {
    console.error("[sitemap:microsite-blog] Failed to load posts", postsError.message)
    return xmlResponse(buildUrlSetXml([]))
  }

  const entries = new Map<string, { loc: string; lastmod?: string }>()

  for (const website of websites) {
    const blogIndexLoc = await buildMicrositeUrl(website.subdomain_slug, "/blog")
    entries.set(blogIndexLoc, { loc: blogIndexLoc })
  }

  for (const post of posts ?? []) {
    const subdomain = subdomainByWebsiteId.get(post.provider_website_id)
    if (!subdomain) continue
    const loc = await buildMicrositeUrl(subdomain, `/blog/${encodeURIComponent(post.slug)}`)
    entries.set(loc, {
      loc,
      lastmod: post.published_at ?? post.updated_at,
    })
  }

  return xmlResponse(buildUrlSetXml([...entries.values()]))
}
