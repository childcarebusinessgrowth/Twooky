import "server-only"

import { unstable_cache, revalidateTag } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { CACHE_TAGS } from "@/lib/cache-tags"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import {
  type ProviderTypeLookup,
  resolveProviderTypeSlug,
} from "@/lib/provider-type-normalization"

type TypedSupabase = SupabaseClient

export type ProviderTypeCategory = {
  id: string
  name: string
  sort_order: number
}

export type ProviderTypeRecord = {
  id: string
  category_id: string
  category_name: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}

export type ProviderTaxonomyMenuGroup = {
  label: string
  links: Array<{ name: string; href: string; slug: string }>
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase()
}

function hrefFromSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase()
  return normalized ? `/${encodeURIComponent(normalized)}` : "/"
}

async function loadProviderTaxonomy() {
  const supabase = getSupabaseAdminClient()

  const [
    { data: categories, error: categoriesError },
    { data: providerTypes, error: providerTypesError },
  ] = await Promise.all([
    supabase
      .from("provider_type_categories")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("provider_types")
      .select("id, category_id, name, slug, sort_order, provider_type_categories!inner(name)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ])

  if (categoriesError) {
    console.error("[provider-taxonomy] Failed to load categories", categoriesError.message)
  }
  if (providerTypesError) {
    console.error("[provider-taxonomy] Failed to load provider types", providerTypesError.message)
  }

  const categoryRows = (categories ?? []) as ProviderTypeCategory[]
  const categoryById = new Map(categoryRows.map((row) => [row.id, row]))
  const typeRows = (providerTypes ?? []).map((row) => {
    const relation = row.provider_type_categories as { name?: string } | null
    const category = categoryById.get(row.category_id)
    return {
      id: row.id,
      category_id: row.category_id,
      category_name: category?.name ?? relation?.name ?? "Providers",
      name: row.name,
      slug: row.slug,
      sort_order: row.sort_order ?? 0,
      is_active: true,
    } satisfies ProviderTypeRecord
  })

  return {
    categories: categoryRows,
    providerTypes: typeRows,
  }
}

const loadProviderTaxonomyCached = unstable_cache(
  async () => loadProviderTaxonomy(),
  ["provider-taxonomy-v1"],
  { revalidate: 600, tags: [CACHE_TAGS.directoryFilters] },
)

export async function getProviderTaxonomy() {
  return loadProviderTaxonomyCached()
}

export async function getProviderTypes(): Promise<ProviderTypeRecord[]> {
  const taxonomy = await getProviderTaxonomy()
  return taxonomy.providerTypes
}

export async function getProviderTypeBySlug(slug: string): Promise<ProviderTypeRecord | null> {
  const normalizedSlug = normalizeSlug(slug)
  if (!normalizedSlug) return null
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("provider_types")
    .select("id, category_id, name, slug, sort_order, provider_type_categories!inner(name)")
    .eq("is_active", true)
    .eq("slug", normalizedSlug)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error("[provider-taxonomy] Failed to load provider type", error.message)
    return null
  }

  const category = data.provider_type_categories as { name?: string } | null
  return {
    id: data.id,
    category_id: data.category_id,
    category_name: category?.name ?? "Providers",
    name: data.name,
    slug: data.slug,
    sort_order: data.sort_order ?? 0,
    is_active: true,
  }
}

export async function getProviderTypeMenuGroups(): Promise<ProviderTaxonomyMenuGroup[]> {
  const { categories, providerTypes } = await getProviderTaxonomy()
  const categoryOrder = new Map(categories.map((category, index) => [category.id, index]))
  const grouped = new Map<string, ProviderTaxonomyMenuGroup>()

  for (const category of categories) {
    grouped.set(category.id, { label: category.name, links: [] })
  }

  for (const item of providerTypes) {
    const group = grouped.get(item.category_id) ?? { label: item.category_name, links: [] }
    group.links.push({ name: item.name, href: hrefFromSlug(item.slug), slug: item.slug })
    grouped.set(item.category_id, group)
  }

  return Array.from(grouped.entries())
    .sort((a, b) => (categoryOrder.get(a[0]) ?? 0) - (categoryOrder.get(b[0]) ?? 0))
    .map(([, group]) => ({
      label: group.label,
      links: group.links.slice().sort((a, b) => a.name.localeCompare(b.name)),
    }))
}

export async function getProviderTypeOptions(): Promise<ProviderTypeRecord[]> {
  return getProviderTypes()
}

export async function getProviderTypeOptionsByIds(
  supabase: TypedSupabase,
  providerTypeIds: string[],
): Promise<Record<string, ProviderTypeRecord[]>> {
  const uniqueProfileIds = Array.from(new Set(providerTypeIds.filter(Boolean)))
  if (uniqueProfileIds.length === 0) return {}
  return {}
}

export async function resolveActiveProviderTypeSlugs(
  supabase: TypedSupabase,
  providerTypes: string[],
): Promise<{ slugs: string[]; ids: string[]; error?: string }> {
  const uniqueInputs = Array.from(new Set(providerTypes.map((value) => value.trim()).filter(Boolean)))
  if (uniqueInputs.length === 0) return { slugs: [], ids: [] }

  const { data, error } = await supabase
    .from("provider_types")
    .select("id, slug, name")
    .eq("is_active", true)

  if (error) {
    return { slugs: [], ids: [], error: error.message }
  }

  const providerTypeLookup = (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
  })) satisfies Array<ProviderTypeLookup & { id: string }>

  const resolvedSlugs = uniqueInputs
    .map((value) => resolveProviderTypeSlug(value, providerTypeLookup))
    .filter((slug): slug is string => Boolean(slug))

  if (resolvedSlugs.length !== uniqueInputs.length) {
    return { slugs: [], ids: [], error: "One or more selected provider types are invalid." }
  }

  const slugs = Array.from(new Set(resolvedSlugs))
  const rowsBySlug = new Map((data ?? []).map((row) => [row.slug, row] as const))

  return {
    slugs,
    ids: slugs
      .map((slug) => rowsBySlug.get(slug)?.id)
      .filter((id): id is string => Boolean(id)),
  }
}

export async function syncProviderTypeAssignments(
  supabase: TypedSupabase,
  profileId: string,
  providerTypeSlugs: string[],
): Promise<{ error: string | null }> {
  const normalizedSlugs = Array.from(
    new Set(providerTypeSlugs.map((value) => value.trim().toLowerCase()).filter(Boolean)),
  )

  const { ids, error: resolutionError } = await resolveActiveProviderTypeSlugs(
    supabase,
    normalizedSlugs,
  )
  if (resolutionError) {
    return { error: resolutionError }
  }

  const { error: deleteError } = await supabase
    .from("provider_profile_provider_types")
    .delete()
    .eq("provider_profile_id", profileId)
  if (deleteError) {
    return { error: deleteError.message }
  }

  if (ids.length > 0) {
    const { error: insertError } = await supabase
      .from("provider_profile_provider_types")
      .insert(
        ids.map((providerTypeId) => ({
          provider_profile_id: profileId,
          provider_type_id: providerTypeId,
        })),
      )
    if (insertError) {
      return { error: insertError.message }
    }
  }

  return { error: null }
}

export async function getProviderTypesByProfileIds(
  supabase: TypedSupabase,
  profileIds: string[],
): Promise<Record<string, ProviderTypeRecord[]>> {
  const uniqueProfileIds = Array.from(new Set(profileIds.filter(Boolean)))
  if (uniqueProfileIds.length === 0) return {}

  const { data: linkRows, error: linkError } = await supabase
    .from("provider_profile_provider_types")
    .select("provider_profile_id, provider_type_id")
    .in("provider_profile_id", uniqueProfileIds)

  if (linkError || !linkRows?.length) return {}

  const typeIds = Array.from(new Set(linkRows.map((row) => row.provider_type_id).filter(Boolean)))
  if (typeIds.length === 0) return {}

  const { data: typeRows, error: typeError } = await supabase
    .from("provider_types")
    .select("id, category_id, name, slug, sort_order, provider_type_categories!inner(name)")
    .eq("is_active", true)
    .in("id", typeIds)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (typeError || !typeRows?.length) return {}

  const categoryLookup = new Map<string, { name?: string; slug?: string }>()
  for (const row of typeRows) {
    const relation = row.provider_type_categories as { name?: string } | null
    categoryLookup.set(row.category_id, relation ?? {})
  }

  const typeById = new Map<string, ProviderTypeRecord>(
    typeRows.map((row) => {
      const relation = row.provider_type_categories as { name?: string; slug?: string } | null
      return [
        row.id,
        {
          id: row.id,
          category_id: row.category_id,
          category_name: relation?.name ?? "Providers",
          name: row.name,
          slug: row.slug,
          sort_order: row.sort_order ?? 0,
          is_active: true,
        } satisfies ProviderTypeRecord,
      ] as const
    }),
  )
  const orderById = new Map(typeRows.map((row, index) => [row.id, index]))

  const result: Record<string, ProviderTypeRecord[]> = {}
  for (const profileId of uniqueProfileIds) {
    const selected = linkRows
      .filter((row) => row.provider_profile_id === profileId)
      .map((row) => typeById.get(row.provider_type_id))
      .filter((row): row is ProviderTypeRecord => row != null)
      .sort(
        (a, b) =>
          (orderById.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (orderById.get(b.id) ?? Number.MAX_SAFE_INTEGER) ||
          a.name.localeCompare(b.name),
      )
    result[profileId] = selected
  }

  return result
}

export function invalidateProviderTaxonomyCache(): void {
  revalidateTag(CACHE_TAGS.directoryFilters, "max")
}

