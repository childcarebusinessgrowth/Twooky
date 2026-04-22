"use server"

import { revalidatePath } from "next/cache"
import { assertAdminPermission } from "@/lib/authzServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import {
  invalidateProviderTaxonomyCache,
  type ProviderTypeRecord,
} from "@/lib/provider-taxonomy"

const ADMIN_DIRECTORY_PATH = "/admin/directory"

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function nextSortOrder<T extends { sort_order: number }>(rows: T[]): number {
  const max = rows.reduce((acc, row) => Math.max(acc, row.sort_order ?? 0), 0)
  return max + 10
}

type CategoryInput = {
  name: string
  isActive: boolean
}

type ProviderTypeInput = {
  name: string
  slug?: string
  categoryId: string
  isActive: boolean
}

export type ProviderTypeCategoryRecord = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

export type ProviderTypeWithCategory = ProviderTypeRecord & {
  categoryId: string
}

export async function createProviderTypeCategory(input: CategoryInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const supabaseAny = supabase as any

  const { data: existingRows } = await supabaseAny
    .from("provider_type_categories")
    .select("sort_order")
    .order("sort_order", { ascending: true })

  const { error } = await supabaseAny.from("provider_type_categories").insert({
    name: input.name.trim(),
    is_active: input.isActive,
    sort_order: nextSortOrder((existingRows ?? []) as Array<{ sort_order: number }>),
  })

  if (error) throw new Error(error.message)

  revalidatePath(ADMIN_DIRECTORY_PATH)
  invalidateProviderTaxonomyCache()
}

export async function updateProviderTypeCategory(id: string, input: CategoryInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const supabaseAny = supabase as any

  const { error } = await supabaseAny
    .from("provider_type_categories")
    .update({
      name: input.name.trim(),
      is_active: input.isActive,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath(ADMIN_DIRECTORY_PATH)
  invalidateProviderTaxonomyCache()
}

export async function deleteProviderTypeCategory(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const supabaseAny = supabase as any
  const { count, error: countError } = await supabaseAny
    .from("provider_types")
    .select("id", { head: true, count: "exact" })
    .eq("category_id", id)

  if (countError) throw new Error(countError.message)
  if ((count ?? 0) > 0) {
    throw new Error("Move or delete the provider types in this category first.")
  }

  const { error } = await supabaseAny.from("provider_type_categories").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidatePath(ADMIN_DIRECTORY_PATH)
  invalidateProviderTaxonomyCache()
}

export async function createProviderType(input: ProviderTypeInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const supabaseAny = supabase as any
  const slug = slugFromName(input.slug ?? input.name)

  const { data: existingRows } = await supabaseAny
    .from("provider_types")
    .select("sort_order")
    .eq("category_id", input.categoryId)
    .order("sort_order", { ascending: true })

  const { error } = await supabaseAny.from("provider_types").insert({
    category_id: input.categoryId,
    name: input.name.trim(),
    slug,
    is_active: input.isActive,
    sort_order: nextSortOrder((existingRows ?? []) as Array<{ sort_order: number }>),
  })

  if (error) throw new Error(error.message)

  revalidatePath(ADMIN_DIRECTORY_PATH)
  invalidateProviderTaxonomyCache()
}

export async function updateProviderType(id: string, input: ProviderTypeInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const supabaseAny = supabase as any
  const slug = slugFromName(input.slug ?? input.name)

  const { error } = await supabaseAny
    .from("provider_types")
    .update({
      category_id: input.categoryId,
      name: input.name.trim(),
      slug,
      is_active: input.isActive,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath(ADMIN_DIRECTORY_PATH)
  invalidateProviderTaxonomyCache()
}

export async function deleteProviderType(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const supabaseAny = supabase as any

  const { error } = await supabaseAny.from("provider_types").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidatePath(ADMIN_DIRECTORY_PATH)
  invalidateProviderTaxonomyCache()
}

