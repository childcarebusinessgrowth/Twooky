import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { buildBreadcrumbSchema, buildWebPageSchema, buildWebSiteSchema, stringifyJsonLd } from "@/lib/schema"
import { getProviderMicrositeBlogList } from "@/lib/provider-microsite-blog"
import { parseThemeTokens } from "@/lib/website-builder/types"
import { buildMicrositeUrl, formatMicrositeNameFromSubdomain } from "@/lib/website-builder/microsite-seo"
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

  const siteName = formatMicrositeNameFromSubdomain(website.subdomain_slug)
  const canonical = await buildMicrositeUrl(website.subdomain_slug, "/blog")

  return {
    title: `Blog | ${siteName}`,
    description: `News, updates, and parenting-friendly stories from ${siteName}.`,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      title: `Blog | ${siteName}`,
      description: `News, updates, and parenting-friendly stories from ${siteName}.`,
      url: canonical,
      siteName,
    },
    twitter: {
      card: "summary",
      title: `Blog | ${siteName}`,
      description: `News, updates, and parenting-friendly stories from ${siteName}.`,
    },
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
  const siteBase = await buildMicrositeUrl(website.subdomain_slug)
  const tokens = parseThemeTokens(website.theme_tokens)
  const siteName = formatMicrositeNameFromSubdomain(website.subdomain_slug)
  const siteUrl = await buildMicrositeUrl(website.subdomain_slug)
  const pageUrl = await buildMicrositeUrl(website.subdomain_slug, "/blog")
  const coverImage = posts[0]?.cover_image_url ?? undefined
  const websiteJsonLd = stringifyJsonLd(
    buildWebSiteSchema({
      url: siteUrl,
      name: siteName,
      description: `${siteName} childcare microsite`,
    }),
  )
  const webpageJsonLd = stringifyJsonLd(
    buildWebPageSchema({
      url: pageUrl,
      name: `Blog | ${siteName}`,
      description: `News, updates, and parenting-friendly stories from ${siteName}.`,
      image: coverImage,
      isPartOf: siteUrl,
    }),
  )
  const breadcrumbJsonLd = stringifyJsonLd(
    buildBreadcrumbSchema([
      { name: "Home", url: siteUrl },
      { name: "Blog", url: pageUrl },
    ])!,
  )

  return (
    <MicrositeBlogThemeWrapper tokens={tokens}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: webpageJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <MicrositeBlogIndexView siteBase={siteBase} posts={posts} tokens={tokens} />
    </MicrositeBlogThemeWrapper>
  )
}
