import "server-only"
import sanitizeHtml from "sanitize-html"
import { createSupabaseServerClient } from "@/lib/supabaseServer"

type BlogRow = {
  slug: string
  title: string
  excerpt: string
  content_html: string
  published_at: string | null
  reading_time: string
  cover_image_url: string | null
  cover_image_alt: string | null
  tags: string[]
  seo_title: string | null
  meta_description: string | null
}

export type PublishedBlog = {
  slug: string
  title: string
  excerpt: string
  contentHtml: string
  publishedAt: string
  readingTime: string
  image: string
  imageAlt: string
  tags: string[]
  seoTitle: string | null
  metaDescription: string | null
}

const BLOG_FALLBACK_IMAGE = "/images/blogs/quality-early-learning.svg"

function mapBlog(row: BlogRow): PublishedBlog {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    contentHtml: row.content_html,
    publishedAt: row.published_at ?? new Date().toISOString(),
    readingTime: row.reading_time || "3 min read",
    image: row.cover_image_url || BLOG_FALLBACK_IMAGE,
    imageAlt: row.cover_image_alt || row.title,
    tags: row.tags ?? [],
    seoTitle: row.seo_title,
    metaDescription: row.meta_description,
  }
}

export async function getPublishedBlogs(): Promise<PublishedBlog[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("blogs")
    .select(
      "slug, title, excerpt, content_html, published_at, reading_time, cover_image_url, cover_image_alt, tags, seo_title, meta_description",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (error) {
    console.error("[blogs] Failed to fetch published blogs", error.message)
    return []
  }

  return (data ?? []).map((row) => mapBlog(row as BlogRow))
}

export async function getPublishedBlogBySlug(slug: string): Promise<PublishedBlog | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("blogs")
    .select(
      "slug, title, excerpt, content_html, published_at, reading_time, cover_image_url, cover_image_alt, tags, seo_title, meta_description",
    )
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    console.error("[blogs] Failed to fetch blog by slug", slug, error.message)
    return null
  }

  if (!data) return null
  return mapBlog(data as BlogRow)
}

export async function getRecentPublishedBlogs(limit = 3): Promise<PublishedBlog[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("blogs")
    .select(
      "slug, title, excerpt, content_html, published_at, reading_time, cover_image_url, cover_image_alt, tags, seo_title, meta_description",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[blogs] Failed to fetch recent blogs", error.message)
    return []
  }

  return (data ?? []).map((row) => mapBlog(row as BlogRow))
}

export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "img",
      "figure",
      "figcaption",
      "iframe",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
      "*": ["class", "id"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  })
}
