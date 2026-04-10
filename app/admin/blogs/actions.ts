"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"
import {
  normalizeBlogSlug,
  sanitizeBlogTags,
  validateBlogInput,
  type BlogInput,
  type BlogStatus,
} from "@/lib/blog-shared"

const ADMIN_BLOGS_PATH = "/admin/blogs"
const PUBLIC_BLOGS_PATH = "/blogs"
const BLOG_IMAGES_BUCKET = "blog-images"
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])

async function assertSlugIsUnique(slug: string, currentId?: string) {
  const supabase = getSupabaseAdminClient()
  let query = supabase.from("blogs").select("id").eq("slug", slug).limit(1)

  if (currentId) {
    query = query.neq("id", currentId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data?.id) {
    throw new Error("A blog with this slug already exists.")
  }
}

function revalidateBlogRoutes(slug?: string | null) {
  revalidatePath(ADMIN_BLOGS_PATH)
  revalidatePath(PUBLIC_BLOGS_PATH)

  if (slug) {
    revalidatePath(`/blogs/${slug}`)
  }
}

function toInsertPayload(input: BlogInput) {
  const normalizedSlug = normalizeBlogSlug(input.slug)
  const trimmedStatus: BlogStatus = input.status === "published" ? "published" : "draft"
  const publishedAt = trimmedStatus === "published" ? new Date().toISOString() : null

  return {
    slug: normalizedSlug,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    content_html: input.contentHtml.trim(),
    status: trimmedStatus,
    featured: input.featured,
    published_at: publishedAt,
    seo_title: input.seoTitle.trim() || null,
    meta_description: input.metaDescription.trim() || null,
    cover_image_url: input.coverImageUrl.trim() || null,
    cover_image_alt: input.coverImageAlt.trim() || null,
    tags: sanitizeBlogTags(input.tags),
    reading_time: input.readingTime.trim() || "3 min read",
  }
}

export async function createBlog(input: BlogInput) {
  await assertServerRole("admin")
  validateBlogInput(input)
  const payload = toInsertPayload(input)
  await assertSlugIsUnique(payload.slug)

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("blogs").insert(payload)

  if (error) {
    throw new Error(error.message)
  }

  revalidateBlogRoutes(payload.slug)
}

export async function updateBlog(id: string, input: BlogInput) {
  await assertServerRole("admin")
  if (!id) {
    throw new Error("Blog id is required.")
  }

  validateBlogInput(input)
  const payload = toInsertPayload(input)
  await assertSlugIsUnique(payload.slug, id)

  const supabase = getSupabaseAdminClient()
  const { data: previous, error: previousError } = await supabase
    .from("blogs")
    .select("slug, published_at")
    .eq("id", id)
    .maybeSingle()

  if (previousError) {
    throw new Error(previousError.message)
  }

  const publishedAt =
    payload.status === "published" ? previous?.published_at ?? new Date().toISOString() : null

  const { error } = await supabase
    .from("blogs")
    .update({
      ...payload,
      published_at: publishedAt,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidateBlogRoutes(previous?.slug)
  revalidateBlogRoutes(payload.slug)
}

export async function deleteBlog(id: string) {
  await assertServerRole("admin")
  if (!id) {
    throw new Error("Blog id is required.")
  }

  const supabase = getSupabaseAdminClient()
  const { data: existing, error: fetchError } = await supabase
    .from("blogs")
    .select("slug")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const { error } = await supabase.from("blogs").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidateBlogRoutes(existing?.slug ?? null)
}

export async function publishBlog(id: string) {
  await assertServerRole("admin")
  if (!id) {
    throw new Error("Blog id is required.")
  }

  const supabase = getSupabaseAdminClient()
  const nowIso = new Date().toISOString()

  const { data: existing, error: fetchError } = await supabase
    .from("blogs")
    .select("slug, published_at")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const { error } = await supabase
    .from("blogs")
    .update({
      status: "published",
      published_at: existing?.published_at ?? nowIso,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidateBlogRoutes(existing?.slug ?? null)
}

export async function unpublishBlog(id: string) {
  await assertServerRole("admin")
  if (!id) {
    throw new Error("Blog id is required.")
  }

  const supabase = getSupabaseAdminClient()
  const { data: existing, error: fetchError } = await supabase
    .from("blogs")
    .select("slug")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const { error } = await supabase
    .from("blogs")
    .update({
      status: "draft",
      published_at: null,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidateBlogRoutes(existing?.slug ?? null)
}

async function ensureBlogImagesBucket() {
  const supabase = getSupabaseAdminClient()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(listError.message)
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === BLOG_IMAGES_BUCKET)
  if (bucketExists) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(BLOG_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_IMAGE_SIZE_BYTES}`,
    allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
  })

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error(createError.message)
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function uploadBlogImage(file: File) {
  await assertServerRole("admin")
  if (!file) {
    throw new Error("No file provided.")
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only PNG, JPG, WEBP, and GIF images are allowed.")
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be 5MB or less.")
  }

  await ensureBlogImagesBucket()
  const supabase = getSupabaseAdminClient()

  const today = new Date()
  const pathPrefix = `${today.getUTCFullYear()}/${String(today.getUTCMonth() + 1).padStart(2, "0")}`
  const safeName = sanitizeFilename(file.name || "image")
  const storagePath = `${pathPrefix}/${Date.now()}-${randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage.from(BLOG_IMAGES_BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from(BLOG_IMAGES_BUCKET).getPublicUrl(storagePath)
  return {
    path: storagePath,
    publicUrl: data.publicUrl,
  }
}
