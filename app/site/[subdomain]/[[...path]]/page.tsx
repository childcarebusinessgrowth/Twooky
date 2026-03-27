import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { MicrositeVisitTracker } from "@/components/provider/website-builder/microsite-visit-tracker"
import { PublicSiteRenderer } from "@/components/provider/website-builder/public-site-renderer"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { parsePublishedSnapshot } from "@/lib/website-builder/snapshot"

interface Props {
  params: Promise<{ subdomain: string; path?: string[] }>
}

function pathKeyFromSegments(segments: string[] | undefined) {
  if (!segments?.length) return ""
  return segments.map((s) => s.toLowerCase()).join("/")
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain, path: pathSegs } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc("get_published_provider_website", { p_subdomain: subdomain })
  const snapshot = parsePublishedSnapshot(data as unknown)
  if (!snapshot) return { title: "Site" }
  const key = pathKeyFromSegments(pathSegs)
  const page = snapshot.pages.find((p) => (key === "" ? p.is_home || p.path_slug === "" : p.path_slug === key))
  const title = page?.seo_title || page?.title || "Provider site"
  return { title, description: page?.meta_description ?? undefined }
}

export default async function ProviderMicrositePage({ params }: Props) {
  const { subdomain, path: pathSegs } = await params
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc("get_published_provider_website", { p_subdomain: subdomain })
  if (error || data == null) notFound()
  const snapshot = parsePublishedSnapshot(data as unknown)
  if (!snapshot) notFound()

  const key = pathKeyFromSegments(pathSegs)
  const page = snapshot.pages.find((p) =>
    key === "" ? p.is_home || p.path_slug === "" : p.path_slug === key,
  )
  if (!page) notFound()

  const siteBase = `/site/${encodeURIComponent(subdomain)}`

  return (
    <>
      <MicrositeVisitTracker subdomain={subdomain} pageSlug={page.path_slug} />
      <PublicSiteRenderer snapshot={snapshot} siteBase={siteBase} page={page} />
    </>
  )
}
