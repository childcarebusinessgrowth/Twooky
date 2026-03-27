"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import type { Json } from "@/lib/supabaseDatabase"
import { buildPublishedSnapshot } from "@/lib/website-builder/snapshot"
import { summarizeMobileValidationIssues, validateMobileWebsite } from "@/lib/website-builder/mobile-validator"
import type { CanvasNode, NavItem, ThemeTokens } from "@/lib/website-builder/types"
import { parseCanvasNodes, parseNavItems, parseThemeTokens } from "@/lib/website-builder/types"
import {
  getBlankDraft,
  getTemplateDraft,
  TEMPLATE_KEYS,
  type TemplateKey,
} from "@/lib/website-builder/templates/presets"
import {
  ALLOWED_WEBSITE_ASSET_TYPES,
  MAX_WEBSITE_ASSET_BYTES,
  PROVIDER_WEBSITE_ASSETS_BUCKET,
} from "./constants"

function sanitizeSubdomainBase(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

async function uniqueSubdomain(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, base: string) {
  let candidate = base || `site-${randomUUID().slice(0, 8)}`
  if (!/^[a-z0-9]/.test(candidate)) candidate = `s-${candidate}`
  for (let i = 0; i < 20; i++) {
    const trySlug = i === 0 ? candidate : `${candidate}-${i + 1}`
    const { data } = await supabase
      .from("provider_websites")
      .select("id")
      .eq("subdomain_slug", trySlug)
      .maybeSingle()
    if (!data) return trySlug
  }
  return `${candidate}-${randomUUID().slice(0, 6)}`
}

export type WebsitePageRow = {
  id: string
  path_slug: string
  title: string
  seo_title: string | null
  meta_description: string | null
  sort_order: number
  is_home: boolean
  canvas_nodes: CanvasNode[]
}

export type WebsiteState = {
  website: {
    id: string
    subdomain_slug: string
    template_key: string | null
    theme_tokens: ThemeTokens
    nav_items: NavItem[]
    published_version_id: string | null
  }
  pages: WebsitePageRow[]
}

export async function loadProviderWebsiteState(): Promise<
  { ok: true; state: WebsiteState | null } | { error: string }
> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "You must be signed in." }

  const { data: website, error: wErr } = await supabase
    .from("provider_websites")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (wErr) return { error: wErr.message }
  if (!website) return { ok: true, state: null }

  const { data: pages, error: pErr } = await supabase
    .from("provider_website_pages")
    .select("*")
    .eq("website_id", website.id)
    .order("sort_order", { ascending: true })

  if (pErr) return { error: pErr.message }

  return {
    ok: true,
    state: {
      website: {
        id: website.id,
        subdomain_slug: website.subdomain_slug,
        template_key: website.template_key,
        theme_tokens: parseThemeTokens(website.theme_tokens),
        nav_items: parseNavItems(website.nav_items),
        published_version_id: website.published_version_id,
      },
      pages: (pages ?? []).map((p) => ({
        id: p.id,
        path_slug: p.path_slug,
        title: p.title,
        seo_title: p.seo_title,
        meta_description: p.meta_description,
        sort_order: p.sort_order,
        is_home: p.is_home,
        canvas_nodes: parseCanvasNodes(p.canvas_nodes),
      })),
    },
  }
}

export type ProviderWebsiteNavSummary = {
  subdomain_slug: string
  published_version_id: string | null
}

/** Lightweight row for sidebar nav (no pages/canvas). */
export async function getProviderWebsiteNavSummary(): Promise<
  { ok: true; summary: ProviderWebsiteNavSummary | null } | { error: string }
> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "You must be signed in." }

  const { data: website, error: wErr } = await supabase
    .from("provider_websites")
    .select("subdomain_slug, published_version_id")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (wErr) return { error: wErr.message }
  if (!website) return { ok: true, summary: null }

  return {
    ok: true,
    summary: {
      subdomain_slug: website.subdomain_slug,
      published_version_id: website.published_version_id,
    },
  }
}

export async function createProviderWebsite(
  templateKey: string | "blank",
): Promise<{ ok: true; state: WebsiteState } | { error: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "You must be signed in." }

  const { data: existing } = await supabase.from("provider_websites").select("id").eq("profile_id", user.id).maybeSingle()
  if (existing) return { error: "You already have a website. Reload the page." }

  const { data: profile } = await supabase
    .from("provider_profiles")
    .select("provider_slug, business_name")
    .eq("profile_id", user.id)
    .maybeSingle()

  const base = sanitizeSubdomainBase(profile?.provider_slug ?? profile?.business_name ?? user.id.slice(0, 8))
  const subdomain = await uniqueSubdomain(supabase, base)

  const newId = () => randomUUID()
  const draft =
    templateKey === "blank" || !TEMPLATE_KEYS.includes(templateKey as TemplateKey)
      ? getBlankDraft(newId)
      : getTemplateDraft(templateKey as TemplateKey, newId)

  const { data: website, error: wIns } = await supabase
    .from("provider_websites")
    .insert({
      profile_id: user.id,
      subdomain_slug: subdomain,
      template_key: draft.template_key === "blank" ? null : draft.template_key,
      theme_tokens: draft.theme_tokens as Json,
      nav_items: draft.nav_items as unknown as Json,
    })
    .select("*")
    .single()

  if (wIns || !website) return { error: wIns?.message ?? "Failed to create website." }

  const pageRows = draft.pages.map((p) => ({
    website_id: website.id,
    path_slug: p.path_slug,
    title: p.title,
    seo_title: p.seo_title ?? null,
    meta_description: p.meta_description ?? null,
    sort_order: p.sort_order,
    is_home: p.is_home,
    canvas_nodes: p.canvas_nodes as unknown as Json,
  }))

  const { data: insertedPages, error: pIns } = await supabase.from("provider_website_pages").insert(pageRows).select("*")

  if (pIns || !insertedPages) {
    await supabase.from("provider_websites").delete().eq("id", website.id)
    return { error: pIns?.message ?? "Failed to create pages." }
  }

  revalidatePath("/dashboard/provider/website")
  revalidatePath("/dashboard/provider/website/build")
  revalidatePath("/site", "layout")

  return {
    ok: true,
    state: {
      website: {
        id: website.id,
        subdomain_slug: website.subdomain_slug,
        template_key: website.template_key,
        theme_tokens: parseThemeTokens(website.theme_tokens),
        nav_items: parseNavItems(website.nav_items),
        published_version_id: website.published_version_id,
      },
      pages: insertedPages.map((p) => ({
        id: p.id,
        path_slug: p.path_slug,
        title: p.title,
        seo_title: p.seo_title,
        meta_description: p.meta_description,
        sort_order: p.sort_order,
        is_home: p.is_home,
        canvas_nodes: parseCanvasNodes(p.canvas_nodes),
      })),
    },
  }
}

export async function saveProviderWebsiteDraft(input: {
  websiteId: string
  theme_tokens?: ThemeTokens
  nav_items?: NavItem[]
  pages?: {
    id: string
    canvas_nodes: CanvasNode[]
    title?: string
    seo_title?: string | null
    meta_description?: string | null
    path_slug?: string
  }[]
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "You must be signed in." }

  const { data: site } = await supabase
    .from("provider_websites")
    .select("id, profile_id")
    .eq("id", input.websiteId)
    .maybeSingle()

  if (!site || site.profile_id !== user.id) return { error: "Website not found." }

  if (input.theme_tokens !== undefined || input.nav_items !== undefined) {
    const { error } = await supabase
      .from("provider_websites")
      .update({
        ...(input.theme_tokens !== undefined ? { theme_tokens: input.theme_tokens as Json } : {}),
        ...(input.nav_items !== undefined ? { nav_items: input.nav_items as unknown as Json } : {}),
      })
      .eq("id", input.websiteId)

    if (error) return { error: error.message }
  }

  if (input.pages?.length) {
    for (const p of input.pages) {
      const patch: Record<string, unknown> = {
        canvas_nodes: p.canvas_nodes as unknown as Json,
      }
      if (p.title !== undefined) patch.title = p.title
      if (p.seo_title !== undefined) patch.seo_title = p.seo_title
      if (p.meta_description !== undefined) patch.meta_description = p.meta_description
      if (p.path_slug !== undefined) patch.path_slug = p.path_slug

      const { error } = await supabase.from("provider_website_pages").update(patch).eq("id", p.id).eq("website_id", input.websiteId)
      if (error) return { error: error.message }
    }
  }

  return { ok: true }
}

export async function addProviderWebsitePage(input: {
  websiteId: string
  path_slug: string
  title: string
}): Promise<{ ok: true; pageId: string } | { error: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "You must be signed in." }

  const slug = sanitizeSubdomainBase(input.path_slug.replace(/\//g, ""))
  if (!slug) return { error: "Invalid path." }

  const { data: site } = await supabase
    .from("provider_websites")
    .select("id, profile_id")
    .eq("id", input.websiteId)
    .maybeSingle()

  if (!site || site.profile_id !== user.id) return { error: "Website not found." }

  const { data: maxRow } = await supabase
    .from("provider_website_pages")
    .select("sort_order")
    .eq("website_id", input.websiteId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (maxRow?.sort_order ?? -1) + 1
  const nid = () => randomUUID()
  const blankNodes: CanvasNode[] = [
    {
      id: nid(),
      type: "text",
      parentId: null,
      zIndex: 10,
      props: { text: input.title, fontSize: 32, fontWeight: 700, color: "#0f172a" },
      layout: { desktop: { x: 48, y: 120, w: 800, h: 48 } },
    },
  ]

  const { data: row, error } = await supabase
    .from("provider_website_pages")
    .insert({
      website_id: input.websiteId,
      path_slug: slug,
      title: input.title.trim() || slug,
      sort_order: sortOrder,
      is_home: false,
      canvas_nodes: blankNodes as unknown as Json,
    })
    .select("id")
    .single()

  if (error || !row) return { error: error?.message ?? "Failed to add page." }
  revalidatePath("/dashboard/provider/website")
  return { ok: true, pageId: row.id }
}

export async function deleteProviderWebsitePage(pageId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "You must be signed in." }

  const { data: page } = await supabase.from("provider_website_pages").select("id, website_id, is_home").eq("id", pageId).maybeSingle()
  if (!page) return { error: "Page not found." }
  if (page.is_home) return { error: "Cannot delete the home page." }

  const { data: site } = await supabase
    .from("provider_websites")
    .select("profile_id")
    .eq("id", page.website_id)
    .maybeSingle()
  if (!site || site.profile_id !== user.id) return { error: "Not allowed." }

  const { error } = await supabase.from("provider_website_pages").delete().eq("id", pageId)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/provider/website")
  return { ok: true }
}

export async function applyProviderWebsiteTemplate(templateKey: string): Promise<{ ok: true; state: WebsiteState } | { error: string }> {
  const newId = () => randomUUID()
  let draft: ReturnType<typeof getBlankDraft>
  if (templateKey === "blank") {
    draft = getBlankDraft(newId)
  } else if (TEMPLATE_KEYS.includes(templateKey as TemplateKey)) {
    draft = getTemplateDraft(templateKey as TemplateKey, newId)
  } else {
    return { error: "Unknown template." }
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "You must be signed in." }

  const { data: website } = await supabase.from("provider_websites").select("*").eq("profile_id", user.id).maybeSingle()
  if (!website) return { error: "Create a website first." }

  const { error: delErr } = await supabase.from("provider_website_pages").delete().eq("website_id", website.id)
  if (delErr) return { error: delErr.message }

  const pageRows = draft.pages.map((p) => ({
    website_id: website.id,
    path_slug: p.path_slug,
    title: p.title,
    seo_title: p.seo_title ?? null,
    meta_description: p.meta_description ?? null,
    sort_order: p.sort_order,
    is_home: p.is_home,
    canvas_nodes: p.canvas_nodes as unknown as Json,
  }))

  const { data: insertedPages, error: pIns } = await supabase.from("provider_website_pages").insert(pageRows).select("*")
  if (pIns || !insertedPages) return { error: pIns?.message ?? "Failed to apply template." }

  const { data: updatedSite, error: uErr } = await supabase
    .from("provider_websites")
    .update({
      template_key: draft.template_key === "blank" ? null : draft.template_key,
      theme_tokens: draft.theme_tokens as Json,
      nav_items: draft.nav_items as unknown as Json,
    })
    .eq("id", website.id)
    .select("*")
    .single()

  if (uErr || !updatedSite) return { error: uErr?.message ?? "Failed to update website." }

  revalidatePath("/dashboard/provider/website")
  revalidatePath("/dashboard/provider/website/build")
  revalidatePath("/site", "layout")

  return {
    ok: true,
    state: {
      website: {
        id: updatedSite.id,
        subdomain_slug: updatedSite.subdomain_slug,
        template_key: updatedSite.template_key,
        theme_tokens: parseThemeTokens(updatedSite.theme_tokens),
        nav_items: parseNavItems(updatedSite.nav_items),
        published_version_id: updatedSite.published_version_id,
      },
      pages: insertedPages.map((p) => ({
        id: p.id,
        path_slug: p.path_slug,
        title: p.title,
        seo_title: p.seo_title,
        meta_description: p.meta_description,
        sort_order: p.sort_order,
        is_home: p.is_home,
        canvas_nodes: parseCanvasNodes(p.canvas_nodes),
      })),
    },
  }
}

export async function publishProviderWebsite(
  websiteId: string,
): Promise<
  | { ok: true; publishedVersionId: string; publishedAt: string | null }
  | { error: string }
> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "You must be signed in." }

  const { data: website } = await supabase.from("provider_websites").select("*").eq("id", websiteId).maybeSingle()
  if (!website || website.profile_id !== user.id) return { error: "Website not found." }

  const { data: pages } = await supabase
    .from("provider_website_pages")
    .select("*")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true })

  const draftPages = (pages ?? []).map((p) => ({
    id: p.id,
    path_slug: p.path_slug,
    title: p.title,
    seo_title: p.seo_title,
    meta_description: p.meta_description,
    is_home: p.is_home,
    sort_order: p.sort_order,
    canvas_nodes: parseCanvasNodes(p.canvas_nodes),
  }))

  const mobileValidation = validateMobileWebsite({
    pages: draftPages.map((p) => ({
      id: p.id,
      path_slug: p.path_slug,
      title: p.title,
      canvas_nodes: p.canvas_nodes,
    })),
  })
  if (!mobileValidation.ok) {
    return { error: summarizeMobileValidationIssues(mobileValidation.issues, 2) }
  }

  const snapshot = buildPublishedSnapshot({
    subdomain_slug: website.subdomain_slug,
    template_key: website.template_key,
    theme: parseThemeTokens(website.theme_tokens),
    nav: parseNavItems(website.nav_items),
    pages: draftPages.map((p) => ({
      path_slug: p.path_slug,
      title: p.title,
      seo_title: p.seo_title,
      meta_description: p.meta_description,
      is_home: p.is_home,
      sort_order: p.sort_order,
      canvas_nodes: p.canvas_nodes,
    })),
  })

  const { data: version, error: vErr } = await supabase
    .from("provider_website_published_versions")
    .insert({
      website_id: websiteId,
      snapshot: snapshot as unknown as Json,
    })
    .select("id, created_at")
    .single()

  if (vErr || !version) return { error: vErr?.message ?? "Publish failed." }

  const { error: uErr } = await supabase
    .from("provider_websites")
    .update({ published_version_id: version.id })
    .eq("id", websiteId)

  if (uErr) return { error: uErr.message }

  // Keep builder UI stable post-publish; the client already refreshes local state.
  revalidatePath("/site", "layout")
  revalidatePath(`/site/${website.subdomain_slug}`, "layout")
  return { ok: true, publishedVersionId: version.id, publishedAt: version.created_at }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

async function ensureWebsiteAssetsBucket() {
  const supabase = getSupabaseAdminClient()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw new Error(listError.message)
  const exists = buckets?.some((b) => b.name === PROVIDER_WEBSITE_ASSETS_BUCKET)
  if (exists) return
  const { error: createError } = await supabase.storage.createBucket(PROVIDER_WEBSITE_ASSETS_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_WEBSITE_ASSET_BYTES}`,
    allowedMimeTypes: Array.from(ALLOWED_WEBSITE_ASSET_TYPES),
  })
  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error(createError.message)
  }
}

export type UploadWebsiteAssetResult = { publicUrl: string; storagePath: string } | { error: string }

export async function uploadProviderWebsiteAsset(
  websiteId: string,
  formData: FormData,
): Promise<UploadWebsiteAssetResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "You must be signed in." }

  const { data: site } = await supabase
    .from("provider_websites")
    .select("id, profile_id")
    .eq("id", websiteId)
    .maybeSingle()
  if (!site || site.profile_id !== user.id) return { error: "Website not found." }

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) return { error: "No file provided." }
  if (!ALLOWED_WEBSITE_ASSET_TYPES.has(file.type)) return { error: "Only PNG, JPG, WebP, or GIF images are allowed." }
  if (file.size > MAX_WEBSITE_ASSET_BYTES) return { error: "File too large (max 8MB)." }

  try {
    await ensureWebsiteAssetsBucket()
    const admin = getSupabaseAdminClient()
    const safeName = sanitizeFilename(file.name || "image")
    const storagePath = `${websiteId}/${randomUUID()}-${safeName}`
    const { error: uploadError } = await admin.storage
      .from(PROVIDER_WEBSITE_ASSETS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })
    if (uploadError) return { error: uploadError.message }

    const { error: insErr } = await supabase.from("provider_website_assets").insert({
      website_id: websiteId,
      storage_path: storagePath,
      content_type: file.type,
      byte_size: file.size,
    })
    if (insErr) {
      await admin.storage.from(PROVIDER_WEBSITE_ASSETS_BUCKET).remove([storagePath])
      return { error: insErr.message }
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) return { error: "Missing NEXT_PUBLIC_SUPABASE_URL." }
    const publicUrl = `${url}/storage/v1/object/public/${PROVIDER_WEBSITE_ASSETS_BUCKET}/${storagePath}`
    return { publicUrl, storagePath }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." }
  }
}
