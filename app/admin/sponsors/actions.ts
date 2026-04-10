"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

const DISCOUNTS_PATH = "/admin/sponsors/discounts"
const LOCAL_SERVICES_PATH = "/admin/sponsors/local-services"

const SPONSOR_ASSETS_BUCKET = "sponsor-assets"
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])

async function ensureSponsorAssetsBucket() {
  const supabase = getSupabaseAdminClient()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(listError.message)
  }

  const bucketExists = buckets?.some((bucket) => bucket.name === SPONSOR_ASSETS_BUCKET)
  if (bucketExists) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(SPONSOR_ASSETS_BUCKET, {
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

export async function uploadSponsorImage(file: File) {
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

  await ensureSponsorAssetsBucket()
  const supabase = getSupabaseAdminClient()

  const today = new Date()
  const pathPrefix = `${today.getUTCFullYear()}/${String(today.getUTCMonth() + 1).padStart(2, "0")}`
  const safeName = sanitizeFilename(file.name || "image")
  const storagePath = `${pathPrefix}/${Date.now()}-${randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage.from(SPONSOR_ASSETS_BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from(SPONSOR_ASSETS_BUCKET).getPublicUrl(storagePath)
  return {
    path: storagePath,
    publicUrl: data.publicUrl,
  }
}

export type SponsorDiscountInput = {
  title: string
  description: string
  imageUrl: string
  discountCode?: string | null
  externalLink?: string | null
  category: string
  offerBadge?: string | null
  isActive: boolean
}

function validateDiscountInput(input: SponsorDiscountInput) {
  if (!input.title?.trim()) throw new Error("Title is required.")
  if (!input.description?.trim()) throw new Error("Description is required.")
  if (!input.imageUrl?.trim()) throw new Error("Image is required.")
  if (!input.category?.trim()) throw new Error("Category is required.")
}

export async function createSponsorDiscount(input: SponsorDiscountInput) {
  await assertServerRole("admin")
  validateDiscountInput(input)
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("sponsor_discounts").insert({
    title: input.title.trim(),
    description: input.description.trim(),
    image_url: input.imageUrl.trim(),
    discount_code: input.discountCode?.trim() || null,
    external_link: input.externalLink?.trim() || null,
    category: input.category.trim(),
    offer_badge: input.offerBadge?.trim() || null,
    is_active: input.isActive,
    sort_order: 0,
  })
  if (error) throw new Error(error.message)
  revalidatePath(DISCOUNTS_PATH)
}

export async function updateSponsorDiscount(id: string, input: SponsorDiscountInput) {
  await assertServerRole("admin")
  if (!id) throw new Error("Id is required.")
  validateDiscountInput(input)
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("sponsor_discounts")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      image_url: input.imageUrl.trim(),
      discount_code: input.discountCode?.trim() || null,
      external_link: input.externalLink?.trim() || null,
      category: input.category.trim(),
      offer_badge: input.offerBadge?.trim() || null,
      is_active: input.isActive,
    })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(DISCOUNTS_PATH)
}

export async function deleteSponsorDiscount(id: string) {
  await assertServerRole("admin")
  if (!id) throw new Error("Id is required.")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("sponsor_discounts").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(DISCOUNTS_PATH)
}

export type LocalServiceDealInput = {
  title: string
  description: string
  imageUrl: string
  ageTarget: string
  providerId: string
  isActive: boolean
}

type ProviderLocationFields = {
  city: string | null
  address: string | null
  business_name: string | null
}

function formatDealLocationFromProvider(p: ProviderLocationFields): string {
  const city = p.city?.trim()
  const address = p.address?.trim()
  if (city && address) return `${city} · ${address}`
  if (city) return city
  if (address) {
    return address.length > 200 ? `${address.slice(0, 197)}…` : address
  }
  return p.business_name?.trim() || "—"
}

function validateLocalDealInput(input: LocalServiceDealInput) {
  if (!input.title?.trim()) throw new Error("Title is required.")
  if (!input.description?.trim()) throw new Error("Description is required.")
  if (!input.imageUrl?.trim()) throw new Error("Image is required.")
  if (!input.ageTarget?.trim()) throw new Error("Age target is required.")
  if (!input.providerId?.trim()) throw new Error("Provider is required.")
}

export async function createLocalServiceDeal(input: LocalServiceDealInput) {
  await assertServerRole("admin")
  validateLocalDealInput(input)
  const supabase = getSupabaseAdminClient()
  const { data: prov, error: pErr } = await supabase
    .from("provider_profiles")
    .select("profile_id, city, address, business_name")
    .eq("profile_id", input.providerId.trim())
    .maybeSingle()
  if (pErr) throw new Error(pErr.message)
  if (!prov) throw new Error("Selected provider was not found.")
  const location = formatDealLocationFromProvider(prov as ProviderLocationFields)
  const { error } = await supabase.from("local_service_deals").insert({
    title: input.title.trim(),
    description: input.description.trim(),
    image_url: input.imageUrl.trim(),
    location,
    age_target: input.ageTarget.trim(),
    provider_id: input.providerId.trim(),
    is_active: input.isActive,
    sort_order: 0,
  })
  if (error) throw new Error(error.message)
  revalidatePath(LOCAL_SERVICES_PATH)
}

export async function updateLocalServiceDeal(id: string, input: LocalServiceDealInput) {
  await assertServerRole("admin")
  if (!id) throw new Error("Id is required.")
  validateLocalDealInput(input)
  const supabase = getSupabaseAdminClient()
  const { data: prov, error: pErr } = await supabase
    .from("provider_profiles")
    .select("profile_id, city, address, business_name")
    .eq("profile_id", input.providerId.trim())
    .maybeSingle()
  if (pErr) throw new Error(pErr.message)
  if (!prov) throw new Error("Selected provider was not found.")
  const location = formatDealLocationFromProvider(prov as ProviderLocationFields)
  const { error } = await supabase
    .from("local_service_deals")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      image_url: input.imageUrl.trim(),
      location,
      age_target: input.ageTarget.trim(),
      provider_id: input.providerId.trim(),
      is_active: input.isActive,
    })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(LOCAL_SERVICES_PATH)
}

export async function deleteLocalServiceDeal(id: string) {
  await assertServerRole("admin")
  if (!id) throw new Error("Id is required.")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("local_service_deals").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath(LOCAL_SERVICES_PATH)
}

export type ProviderSearchRow = {
  profile_id: string
  business_name: string | null
  city: string | null
}

export async function searchProviders(query: string): Promise<ProviderSearchRow[]> {
  await assertServerRole("admin")
  const q = query.trim()
  const supabase = getSupabaseAdminClient()
  let request = supabase
    .from("provider_profiles")
    .select("profile_id, business_name, city")
    .order("business_name", { ascending: true })
    .limit(25)

  if (q.length >= 2) {
    request = request.or(`business_name.ilike.%${q}%,city.ilike.%${q}%`)
  }

  const { data, error } = await request
  if (error) throw new Error(error.message)
  return (data ?? []) as ProviderSearchRow[]
}
