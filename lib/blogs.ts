import "server-only"
import sanitizeHtml from "sanitize-html"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

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

type BlogListRow = Omit<BlogRow, "content_html">

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

export type PublishedBlogListItem = Omit<PublishedBlog, "contentHtml">

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

function mapBlogList(row: BlogListRow): PublishedBlogListItem {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
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
  const supabase = getSupabaseAdminClient()
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

export async function getPublishedBlogPreviews(): Promise<PublishedBlogListItem[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("blogs")
    .select(
      "slug, title, excerpt, published_at, reading_time, cover_image_url, cover_image_alt, tags, seo_title, meta_description",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (error) {
    console.error("[blogs] Failed to fetch published blog previews", error.message)
    return []
  }

  return (data ?? []).map((row) => mapBlogList(row as BlogListRow))
}

export async function getPublishedBlogBySlug(slug: string): Promise<PublishedBlog | null> {
  const supabase = getSupabaseAdminClient()
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

export async function getRecentPublishedBlogs(limit = 3): Promise<PublishedBlogListItem[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("blogs")
    .select(
      "slug, title, excerpt, published_at, reading_time, cover_image_url, cover_image_alt, tags, seo_title, meta_description",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[blogs] Failed to fetch recent blogs", error.message)
    return []
  }

  return (data ?? []).map((row) => mapBlogList(row as BlogListRow))
}

export async function getRelatedPublishedBlogs(
  excludeSlug: string,
  limit = 3,
): Promise<PublishedBlogListItem[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("blogs")
    .select(
      "slug, title, excerpt, published_at, reading_time, cover_image_url, cover_image_alt, tags, seo_title, meta_description",
    )
    .eq("status", "published")
    .neq("slug", excludeSlug)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[blogs] Failed to fetch related blogs", error.message)
    return []
  }

  return (data ?? []).map((row) => mapBlogList(row as BlogListRow))
}

/** Normalize protocol-less URLs so they pass allowedSchemes and work as external links. */
function normalizeLinkHref(href: string): string {
  const t = href.trim()
  if (!t) return t
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(t)) return t
  return `https://${t}`
}

/** Preprocess HTML so anchor hrefs without a scheme get https:// before sanitizer runs (scheme check can run before transformTags). */
function preprocessLinkHrefs(html: string): string {
  return html.replace(
    /<a\s+([^>]*?)href=["']([^"']*)["']/gi,
    (_match, before: string, href: string) => {
      const normalized = normalizeLinkHref(href)
      return `<a ${before}href="${normalized}"`
    },
  )
}

export function sanitizeBlogHtml(html: string): string {
  const withAbsoluteLinks = preprocessLinkHrefs(html)
  return sanitizeHtml(withAbsoluteLinks, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
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
      a(tagName, attribs) {
        const href = attribs.href
        if (href && typeof href === "string") {
          attribs = { ...attribs, href: normalizeLinkHref(href) }
        }
        attribs.rel = "noopener noreferrer"
        return { tagName, attribs }
      },
    },
  })
}
