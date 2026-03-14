import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AdminBlogsPageClient } from "./pageClient"

export const dynamic = "force-dynamic"

type BlogRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  content_html: string
  status: "draft" | "published"
  featured: boolean
  published_at: string | null
  seo_title: string | null
  meta_description: string | null
  cover_image_url: string | null
  cover_image_alt: string | null
  tags: string[]
  reading_time: string
  created_at: string
  updated_at: string
}

async function loadBlogs(): Promise<BlogRow[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("blogs")
    .select(
      "id, slug, title, excerpt, content_html, status, featured, published_at, seo_title, meta_description, cover_image_url, cover_image_alt, tags, reading_time, created_at, updated_at",
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[admin/blogs] Failed to load blogs", error.message)
    return []
  }

  return (data ?? []) as BlogRow[]
}

export default async function AdminBlogsPage() {
  const initialBlogs = await loadBlogs()
  return <AdminBlogsPageClient initialBlogs={initialBlogs} />
}
