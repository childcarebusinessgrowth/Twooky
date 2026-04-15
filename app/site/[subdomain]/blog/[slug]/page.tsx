import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { getProviderMicrositeBlogPost } from "@/lib/provider-microsite-blog"
import { sanitizeBlogHtml } from "@/lib/blogs"
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildWebPageSchema,
  buildWebSiteSchema,
  stringifyJsonLd,
} from "@/lib/schema"
import { parseThemeTokens } from "@/lib/website-builder/types"
import { buildMicrositeUrl, formatMicrositeNameFromSubdomain } from "@/lib/website-builder/microsite-seo"
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
  const siteName = formatMicrositeNameFromSubdomain(subdomain)
  const title = post.seo_title || post.title
  const description = post.meta_description || post.excerpt
  const canonical = await buildMicrositeUrl(subdomain, `/blog/${encodeURIComponent(post.slug)}`)
  const image = post.cover_image_url ?? undefined
  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      siteName,
      publishedTime: post.published_at ?? undefined,
      images: image ? [{ url: image, alt: post.cover_image_alt || post.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
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

  const siteBase = await buildMicrositeUrl(website.subdomain_slug)
  const safeHtml = sanitizeBlogHtml(post.content_html)
  const tokens = parseThemeTokens(website.theme_tokens)
  const siteName = formatMicrositeNameFromSubdomain(website.subdomain_slug)
  const siteUrl = await buildMicrositeUrl(website.subdomain_slug)
  const pageUrl = await buildMicrositeUrl(website.subdomain_slug, `/blog/${encodeURIComponent(post.slug)}`)
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
      name: post.seo_title || post.title,
      description: post.meta_description || post.excerpt,
      image: post.cover_image_url ?? undefined,
      isPartOf: siteUrl,
    }),
  )
  const articleJsonLd = stringifyJsonLd(
    buildArticleSchema({
      url: pageUrl,
      headline: post.seo_title || post.title,
      description: post.meta_description || post.excerpt,
      image: post.cover_image_url ?? undefined,
      datePublished: post.published_at,
      authorName: siteName,
      publisherName: siteName,
    }),
  )
  const blogUrl = await buildMicrositeUrl(website.subdomain_slug, "/blog")
  const breadcrumbJsonLd = stringifyJsonLd(
    buildBreadcrumbSchema([
      { name: "Home", url: siteUrl },
      { name: "Blog", url: blogUrl },
      { name: post.title, url: pageUrl },
    ])!,
  )

  return (
    <MicrositeBlogThemeWrapper tokens={tokens}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: webpageJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <MicrositeBlogPostView siteBase={siteBase} post={post} safeHtml={safeHtml} tokens={tokens} />
    </MicrositeBlogThemeWrapper>
  )
}
