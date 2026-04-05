import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { getProviderMicrositeBlogPost } from "@/lib/provider-microsite-blog"
import { sanitizeBlogHtml } from "@/lib/blogs"
import { parseThemeTokens } from "@/lib/website-builder/types"
import { MicrositeBlogThemeWrapper } from "@/components/provider/microsite-blog/microsite-blog-theme-wrapper"
import { MicrositeBlogPostView } from "@/components/provider/microsite-blog/blog-post-view"

type Props = {
  params: Promise<{ subdomain: string; slug: string }>
}

export const revalidate = 120

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain, slug } = await params
  const post = await getProviderMicrositeBlogPost(subdomain, slug)
  if (!post) {
    return { title: "Post not found" }
  }
  return {
    title: post.seo_title || post.title,
    description: post.meta_description || post.excerpt,
  }
}

export default async function ProviderMicrositeBlogPostPage({ params }: Props) {
  const { subdomain, slug } = await params
  const supabase = getSupabaseAdminClient()
  const sub = subdomain.trim().toLowerCase()
  const { data: website } = await supabase
    .from("provider_websites")
    .select("subdomain_slug, published_version_id, theme_tokens")
    .eq("subdomain_slug", sub)
    .maybeSingle()

  if (!website?.published_version_id) {
    notFound()
  }

  const post = await getProviderMicrositeBlogPost(subdomain, slug)
  if (!post) {
    notFound()
  }

  const siteBase = `/site/${encodeURIComponent(website.subdomain_slug)}`
  const safeHtml = sanitizeBlogHtml(post.content_html)
  const tokens = parseThemeTokens(website.theme_tokens)

  return (
    <MicrositeBlogThemeWrapper tokens={tokens}>
      <MicrositeBlogPostView siteBase={siteBase} post={post} safeHtml={safeHtml} tokens={tokens} />
    </MicrositeBlogThemeWrapper>
  )
}
