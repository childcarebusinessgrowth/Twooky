/** Shared blog field validation and normalization (admin CMS + provider mini-site blog). */

export type BlogStatus = "draft" | "published"

export type BlogInput = {
  title: string
  slug: string
  excerpt: string
  contentHtml: string
  status: BlogStatus
  featured: boolean
  seoTitle: string
  metaDescription: string
  coverImageUrl: string
  coverImageAlt: string
  tags: string[]
  readingTime: string
}

export function normalizeBlogSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function sanitizeBlogTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  )
}

export function validateBlogInput(input: BlogInput) {
  if (!input.title.trim()) {
    throw new Error("Title is required.")
  }

  const normalizedSlug = normalizeBlogSlug(input.slug)
  if (!normalizedSlug) {
    throw new Error("Slug is required.")
  }

  if (!input.excerpt.trim()) {
    throw new Error("Excerpt is required.")
  }

  if (!input.contentHtml.trim()) {
    throw new Error("Content is required.")
  }

  if (input.seoTitle.trim().length > 70) {
    throw new Error("SEO title should be 70 characters or less.")
  }

  if (input.metaDescription.trim().length > 180) {
    throw new Error("Meta description should be 180 characters or less.")
  }
}
