"use server"

import { revalidatePath } from "next/cache"
import {
  revalidateDirectoryMetadataCaches,
  revalidateFooterCitiesCache,
} from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertAdminPermission } from "@/lib/authzServer"

type CountryInput = {
  id?: string
  code: string
  name: string
  sortOrder?: number
  isActive?: boolean
}

type CityInput = {
  id?: string
  countryId: string
  name: string
  slug: string
  searchCountryCode: string
  searchCitySlug: string
  sortOrder?: number
  isPopular?: boolean
  isActive?: boolean
}

const ADMIN_LOCATIONS_PATH = "/admin/locations"

function toTitleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

export async function createCountry(input: CountryInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    code: input.code.trim().toLowerCase(),
    name: toTitleCase(input.name),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }

  const { error } = await supabase.from("countries").insert(values)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
  revalidateFooterCitiesCache()
}

export async function updateCountry(id: string, input: CountryInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    code: input.code.trim().toLowerCase(),
    name: toTitleCase(input.name),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }

  const { error } = await supabase
    .from("countries")
    .update(values)
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
  revalidateFooterCitiesCache()
}

export async function deleteCountry(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from("countries").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
  revalidateFooterCitiesCache()
}

export async function createCity(input: CityInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    country_id: input.countryId,
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    search_country_code: input.searchCountryCode.trim().toLowerCase(),
    search_city_slug: input.searchCitySlug.trim().toLowerCase(),
    is_popular: input.isPopular ?? true,
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }

  const { error } = await supabase.from("cities").insert(values)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
  revalidateFooterCitiesCache()
}

export async function updateCity(id: string, input: CityInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    country_id: input.countryId,
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    search_country_code: input.searchCountryCode.trim().toLowerCase(),
    search_city_slug: input.searchCitySlug.trim().toLowerCase(),
    is_popular: input.isPopular ?? true,
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }

  const { error } = await supabase
    .from("cities")
    .update(values)
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
  revalidateFooterCitiesCache()
}

export async function deleteCity(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from("cities").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
  revalidateFooterCitiesCache()
}

