"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  normalizeBlogSlug,
  sanitizeBlogTags,
  validateBlogInput,
  type BlogInput,
  type BlogStatus,
} from "@/lib/blog-shared"
import { resolveOwnedProviderProfileIds } from "@/lib/provider-ownership"
import { uploadProviderWebsiteAsset } from "@/app/dashboard/provider/website/actions"

const DASH_PATH = "/dashboard/provider/website/blog"

async function getWebsiteForCurrentUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("You must be signed in.")
  }
  const ownedProfileIds = await resolveOwnedProviderProfileIds(supabase, user.id)
  let { data: website, error: wErr } = await supabase
    .from("provider_websites")
    .select("id, subdomain_slug")
    .eq("profile_id", ownedProfileIds[0])
    .maybeSingle()

  if (!website && !wErr && ownedProfileIds.length > 1) {
    const fallbackWebsiteResult = await supabase
      .from("provider_websites")
      .select("id, subdomain_slug")
      .eq("profile_id", ownedProfileIds[1])
      .maybeSingle()
    website = fallbackWebsiteResult.data
    wErr = fallbackWebsiteResult.error
  }

  if (wErr) throw new Error(wErr.message)
  return { supabase, user, website }
}

function revalidateProviderBlogRoutes(subdomain: string, slug?: string | null) {
  revalidatePath(DASH_PATH)
  revalidatePath(`/site/${subdomain}/blog`)
  if (slug) {
    revalidatePath(`/site/${subdomain}/blog/${slug}`)
  }
}

function toInsertPayload(input: BlogInput, websiteId: string) {
  const normalizedSlug = normalizeBlogSlug(input.slug)
  const trimmedStatus: BlogStatus = input.status === "published" ? "published" : "draft"
  const publishedAt = trimmedStatus === "published" ? new Date().toISOString() : null

  return {
    provider_website_id: websiteId,
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

async function assertSlugUniqueForWebsite(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  websiteId: string,
  slug: string,
  currentId?: string,
) {
  let query = supabase
    .from("provider_blog_posts")
    .select("id")
    .eq("provider_website_id", websiteId)
    .eq("slug", slug)
    .limit(1)

  if (currentId) {
    query = query.neq("id", currentId)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  if (data?.id) {
    throw new Error("A post with this slug already exists on your site.")
  }
}

export async function createProviderBlogPost(input: BlogInput) {
  const { supabase, website } = await getWebsiteForCurrentUser()
  if (!website) {
    throw new Error("Create your site from Templates first, then add blog posts.")
  }
  validateBlogInput(input)
  const payload = toInsertPayload(input, website.id)
  await assertSlugUniqueForWebsite(supabase, website.id, payload.slug)

  const { error } = await supabase.from("provider_blog_posts").insert(payload)
  if (error) throw new Error(error.message)

  revalidateProviderBlogRoutes(website.subdomain_slug, payload.slug)
}

export async function updateProviderBlogPost(id: string, input: BlogInput) {
  if (!id) throw new Error("Post id is required.")
  const { supabase, website } = await getWebsiteForCurrentUser()
  if (!website) {
    throw new Error("Create your site from Templates first.")
  }
  validateBlogInput(input)
  const payload = toInsertPayload(input, website.id)

  const { data: previous, error: prevErr } = await supabase
    .from("provider_blog_posts")
    .select("slug, published_at")
    .eq("id", id)
    .eq("provider_website_id", website.id)
    .maybeSingle()

  if (prevErr) throw new Error(prevErr.message)
  if (!previous) throw new Error("Post not found.")

  await assertSlugUniqueForWebsite(supabase, website.id, payload.slug, id)

  const publishedAt =
    payload.status === "published" ? previous.published_at ?? new Date().toISOString() : null

  const { error } = await supabase
    .from("provider_blog_posts")
    .update({
      slug: payload.slug,
      title: payload.title,
      excerpt: payload.excerpt,
      content_html: payload.content_html,
      status: payload.status,
      featured: payload.featured,
      published_at: publishedAt,
      seo_title: payload.seo_title,
      meta_description: payload.meta_description,
      cover_image_url: payload.cover_image_url,
      cover_image_alt: payload.cover_image_alt,
      tags: payload.tags,
      reading_time: payload.reading_time,
    })
    .eq("id", id)
    .eq("provider_website_id", website.id)

  if (error) throw new Error(error.message)

  revalidateProviderBlogRoutes(website.subdomain_slug, previous.slug)
  if (previous.slug !== payload.slug) {
    revalidateProviderBlogRoutes(website.subdomain_slug, payload.slug)
  }
}

export async function deleteProviderBlogPost(id: string) {
  if (!id) throw new Error("Post id is required.")
  const { supabase, website } = await getWebsiteForCurrentUser()
  if (!website) throw new Error("Website not found.")

  const { data: existing, error: fetchError } = await supabase
    .from("provider_blog_posts")
    .select("slug")
    .eq("id", id)
    .eq("provider_website_id", website.id)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!existing) throw new Error("Post not found.")

  const { error } = await supabase.from("provider_blog_posts").delete().eq("id", id)

  if (error) throw new Error(error.message)

  revalidateProviderBlogRoutes(website.subdomain_slug, existing.slug)
}

export async function publishProviderBlogPost(id: string) {
  if (!id) throw new Error("Post id is required.")
  const { supabase, website } = await getWebsiteForCurrentUser()
  if (!website) throw new Error("Website not found.")

  const { data: existing, error: fetchError } = await supabase
    .from("provider_blog_posts")
    .select("slug, published_at")
    .eq("id", id)
    .eq("provider_website_id", website.id)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!existing) throw new Error("Post not found.")

  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from("provider_blog_posts")
    .update({
      status: "published",
      published_at: existing.published_at ?? nowIso,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidateProviderBlogRoutes(website.subdomain_slug, existing.slug)
}

export async function unpublishProviderBlogPost(id: string) {
  if (!id) throw new Error("Post id is required.")
  const { supabase, website } = await getWebsiteForCurrentUser()
  if (!website) throw new Error("Website not found.")

  const { data: existing, error: fetchError } = await supabase
    .from("provider_blog_posts")
    .select("slug")
    .eq("id", id)
    .eq("provider_website_id", website.id)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!existing) throw new Error("Post not found.")

  const { error } = await supabase
    .from("provider_blog_posts")
    .update({
      status: "draft",
      published_at: null,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidateProviderBlogRoutes(website.subdomain_slug, existing.slug)
}

export async function uploadProviderBlogImage(websiteId: string, file: File) {
  const formData = new FormData()
  formData.set("file", file)
  const result = await uploadProviderWebsiteAsset(websiteId, formData)
  if ("error" in result) {
    throw new Error(result.error)
  }
  return { publicUrl: result.publicUrl }
}
