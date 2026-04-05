import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { getProviderMicrositeBlogList } from "@/lib/provider-microsite-blog"
import { parseThemeTokens } from "@/lib/website-builder/types"
import { MicrositeBlogThemeWrapper } from "@/components/provider/microsite-blog/microsite-blog-theme-wrapper"
import { MicrositeBlogIndexView } from "@/components/provider/microsite-blog/blog-index-view"

type Props = {
  params: Promise<{ subdomain: string }>
}

export const revalidate = 120

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params
  const supabase = getSupabaseAdminClient()
  const sub = subdomain.trim().toLowerCase()
  const { data: website } = await supabase
    .from("provider_websites")
    .select("subdomain_slug")
    .eq("subdomain_slug", sub)
    .maybeSingle()

  if (!website) {
    return { title: "Blog" }
  }

  return {
    title: `Blog | ${website.subdomain_slug}`,
    description: `News and updates from ${website.subdomain_slug}.`,
  }
}

export default async function ProviderMicrositeBlogIndexPage({ params }: Props) {
  const { subdomain } = await params
  const supabase = getSupabaseAdminClient()
  const sub = subdomain.trim().toLowerCase()
  const { data: website } = await supabase
    .from("provider_websites")
    .select("id, subdomain_slug, published_version_id, theme_tokens")
    .eq("subdomain_slug", sub)
    .maybeSingle()

  if (!website) {
    notFound()
  }

  if (!website.published_version_id) {
    notFound()
  }

  const posts = await getProviderMicrositeBlogList(subdomain)
  const siteBase = `/site/${encodeURIComponent(website.subdomain_slug)}`
  const tokens = parseThemeTokens(website.theme_tokens)

  return (
    <MicrositeBlogThemeWrapper tokens={tokens}>
      <MicrositeBlogIndexView siteBase={siteBase} posts={posts} tokens={tokens} />
    </MicrositeBlogThemeWrapper>
  )
}
