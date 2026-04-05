import "server-only"

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export type ProviderMicrositeBlogListItem = {
  slug: string
  title: string
  excerpt: string
  published_at: string | null
  reading_time: string
  cover_image_url: string | null
  cover_image_alt: string | null
  tags: string[]
}

export type ProviderMicrositeBlogPost = ProviderMicrositeBlogListItem & {
  content_html: string
  seo_title: string | null
  meta_description: string | null
}

function normalizeSubdomain(raw: string): string {
  return raw.trim().toLowerCase()
}

export async function getProviderMicrositeBlogList(
  subdomain: string,
): Promise<ProviderMicrositeBlogListItem[]> {
  const supabase = getSupabaseAdminClient()
  const sub = normalizeSubdomain(subdomain)
  const { data: website, error: wErr } = await supabase
    .from("provider_websites")
    .select("id")
    .eq("subdomain_slug", sub)
    .maybeSingle()

  if (wErr || !website) return []

  const { data, error } = await supabase
    .from("provider_blog_posts")
    .select(
      "slug, title, excerpt, published_at, reading_time, cover_image_url, cover_image_alt, tags",
    )
    .eq("provider_website_id", website.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (error) {
    console.error("[provider-microsite-blog] list", error.message)
    return []
  }

  return (data ?? []) as ProviderMicrositeBlogListItem[]
}

export async function getProviderMicrositeBlogPost(
  subdomain: string,
  slug: string,
): Promise<ProviderMicrositeBlogPost | null> {
  const supabase = getSupabaseAdminClient()
  const sub = normalizeSubdomain(subdomain)
  const slugNorm = slug.trim().toLowerCase()

  const { data: website, error: wErr } = await supabase
    .from("provider_websites")
    .select("id")
    .eq("subdomain_slug", sub)
    .maybeSingle()

  if (wErr || !website) return null

  const { data, error } = await supabase
    .from("provider_blog_posts")
    .select(
      "slug, title, excerpt, content_html, published_at, reading_time, cover_image_url, cover_image_alt, tags, seo_title, meta_description",
    )
    .eq("provider_website_id", website.id)
    .eq("slug", slugNorm)
    .eq("status", "published")
    .maybeSingle()

  if (error) {
    console.error("[provider-microsite-blog] post", error.message)
    return null
  }

  if (!data) return null
  return data as ProviderMicrositeBlogPost
}
