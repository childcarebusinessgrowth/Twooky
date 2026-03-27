import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { isProviderWebsiteBuilderEnabled } from "@/lib/website-builder/feature-flag"
import { ProviderBlogsPageClient, type ProviderBlogRecord } from "./pageClient"

export const dynamic = "force-dynamic"

export default async function ProviderBlogPage() {
  if (!isProviderWebsiteBuilderEnabled()) {
    redirect("/dashboard/provider")
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const { data: website } = await supabase
    .from("provider_websites")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle()

  const { data: posts } = website
    ? await supabase
        .from("provider_blog_posts")
        .select(
          "id, slug, title, excerpt, content_html, status, featured, published_at, seo_title, meta_description, cover_image_url, cover_image_alt, tags, reading_time, created_at, updated_at",
        )
        .eq("provider_website_id", website.id)
        .order("created_at", { ascending: false })
    : { data: [] }

  return (
    <ProviderBlogsPageClient
      initialPosts={(posts ?? []) as ProviderBlogRecord[]}
      hasWebsite={!!website}
      websiteId={website?.id ?? null}
    />
  )
}
