import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MicrositeVisitTracker } from "@/components/provider/website-builder/microsite-visit-tracker"
import { PublicSiteRenderer } from "@/components/provider/website-builder/public-site-renderer"
import { buildBreadcrumbSchema, buildWebPageSchema, buildWebSiteSchema, stringifyJsonLd } from "@/lib/schema"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  buildMicrositeUrl,
  deriveMicrositeSiteName,
  findMicrositeImage,
  pagePathnameFromSlug,
} from "@/lib/website-builder/microsite-seo"
import { parsePublishedSnapshot } from "@/lib/website-builder/snapshot"

interface Props {
  params: Promise<{ subdomain: string; path?: string[] }>
}

export const revalidate = 120

function pathKeyFromSegments(segments: string[] | undefined) {
  if (!segments?.length) return ""
  return segments.map((s) => s.toLowerCase()).join("/")
}

const getPublishedMicrositeSnapshot = cache(async (subdomain: string) => {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc("get_published_provider_website", {
    p_subdomain: subdomain.trim().toLowerCase(),
  })
  return parsePublishedSnapshot(data as unknown)
})

function findPageByKey(snapshot: NonNullable<Awaited<ReturnType<typeof getPublishedMicrositeSnapshot>>>, key: string) {
  return snapshot.pages.find((p) => (key === "" ? p.is_home || p.path_slug === "" : p.path_slug === key))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain, path: pathSegs } = await params
  const snapshot = await getPublishedMicrositeSnapshot(subdomain)
  if (!snapshot) return { title: "Site" }

  const key = pathKeyFromSegments(pathSegs)
  const page = findPageByKey(snapshot, key)
  const siteName = deriveMicrositeSiteName(snapshot, page)
  const title = page?.seo_title || (page ? `${page.title} | ${siteName}` : siteName)
  const description =
    page?.meta_description ??
    `Explore ${siteName}, a warm and beautifully presented childcare microsite for families with babies and young children.`
  const canonical = await buildMicrositeUrl(subdomain, pagePathnameFromSlug(page?.path_slug ?? ""))
  const image = page ? findMicrositeImage(page.nodes) : null

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName,
      images: image ? [{ url: image, alt: page?.title ?? siteName }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function ProviderMicrositePage({ params }: Props) {
  const { subdomain, path: pathSegs } = await params
  const snapshot = await getPublishedMicrositeSnapshot(subdomain)
  if (!snapshot) notFound()

  const key = pathKeyFromSegments(pathSegs)
  const page = findPageByKey(snapshot, key)
  if (!page) notFound()

  const siteBase = await buildMicrositeUrl(subdomain)
  const siteName = deriveMicrositeSiteName(snapshot, page)
  const siteUrl = await buildMicrositeUrl(subdomain)
  const pageUrl = await buildMicrositeUrl(subdomain, pagePathnameFromSlug(page.path_slug))
  const image = findMicrositeImage(page.nodes) ?? undefined
  const websiteJsonLd = stringifyJsonLd(
    buildWebSiteSchema({
      url: siteUrl,
      name: siteName,
      description:
        snapshot.pages.find((entry) => entry.is_home || entry.path_slug === "")?.meta_description ??
        `${siteName} childcare microsite`,
    }),
  )
  const webpageJsonLd = stringifyJsonLd(
    buildWebPageSchema({
      url: pageUrl,
      name: page.seo_title || `${page.title} | ${siteName}`,
      description: page.meta_description ?? undefined,
      image,
      isPartOf: siteUrl,
    }),
  )
  const breadcrumbSchema = buildBreadcrumbSchema(
    page.path_slug
      ? [
          { name: "Home", url: siteUrl },
          { name: page.title, url: pageUrl },
        ]
      : [{ name: siteName, url: siteUrl }],
  )
  const breadcrumbJsonLd = breadcrumbSchema ? stringifyJsonLd(breadcrumbSchema) : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: webpageJsonLd }} />
      {breadcrumbJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} /> : null}
      <MicrositeVisitTracker subdomain={subdomain} pageSlug={page.path_slug} />
      <PublicSiteRenderer snapshot={snapshot} siteBase={siteBase} page={page} />
    </>
  )
}
