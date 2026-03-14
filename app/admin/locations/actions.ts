"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

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

export async function createCountry(input: CountryInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from("countries").insert({
    code: input.code.trim().toLowerCase(),
    name: input.name.trim(),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
}

export async function updateCountry(id: string, input: CountryInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("countries")
    .update({
      code: input.code.trim().toLowerCase(),
      name: input.name.trim(),
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
}

export async function deleteCountry(id: string) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from("countries").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
}

export async function createCity(input: CityInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from("cities").insert({
    country_id: input.countryId,
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    search_country_code: input.searchCountryCode.trim().toLowerCase(),
    search_city_slug: input.searchCitySlug.trim().toLowerCase(),
    sort_order: input.sortOrder ?? 0,
    is_popular: input.isPopular ?? true,
    is_active: input.isActive ?? true,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
}

export async function updateCity(id: string, input: CityInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("cities")
    .update({
      country_id: input.countryId,
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      search_country_code: input.searchCountryCode.trim().toLowerCase(),
      search_city_slug: input.searchCitySlug.trim().toLowerCase(),
      sort_order: input.sortOrder ?? 0,
      is_popular: input.isPopular ?? true,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
}

export async function deleteCity(id: string) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from("cities").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LOCATIONS_PATH)
}

