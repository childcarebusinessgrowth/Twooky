import { Suspense } from "react"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AdminDirectoryPageClient } from "./pageClient"

type CountryRow = {
  id: string
  code: string
  name: string
  sort_order: number
  is_active: boolean
}

type CityRow = {
  id: string
  country_id: string
  name: string
  slug: string
  search_country_code: string
  search_city_slug: string
  is_popular: boolean
  sort_order: number
  is_active: boolean
}

type AgeGroupRow = {
  id: string
  name: string
  age_range: string | null
  sort_order: number
  is_active: boolean
}

type ProgramTypeRow = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  about_text: string | null
  key_benefits: string[] | null
  short_description: string | null
  age_group_ids: string[] | null
  slug: string | null
}

type LanguageRow = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

type CurriculumRow = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

type FeatureRow = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

async function loadDirectoryData() {
  const supabase = getSupabaseAdminClient()

  const [
    { data: countries, error: countriesError },
    { data: cities, error: citiesError },
    { data: ageGroups, error: ageGroupsError },
    { data: programTypes, error: programTypesError },
    { data: languages, error: languagesError },
    { data: curriculum, error: curriculumError },
    { data: features, error: featuresError },
  ] = await Promise.all([
    supabase
      .from("countries")
      .select("id, code, name, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("cities")
      .select(
        "id, country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active",
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("age_groups")
      .select("id, name, age_range, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("program_types")
      .select("id, name, sort_order, is_active, about_text, key_benefits, short_description, age_group_ids, slug")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("languages")
      .select("id, name, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("curriculum_philosophies")
      .select("id, name, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("provider_features")
      .select("id, name, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ])

  if (countriesError) console.error("[admin/directory] Failed to load countries", countriesError.message)
  if (citiesError) console.error("[admin/directory] Failed to load cities", citiesError.message)
  if (ageGroupsError) console.error("[admin/directory] Failed to load age groups", ageGroupsError.message)
  if (programTypesError) console.error("[admin/directory] Failed to load program types", programTypesError.message)
  if (languagesError) console.error("[admin/directory] Failed to load languages", languagesError.message)
  if (curriculumError) console.error("[admin/directory] Failed to load curriculum", curriculumError.message)
  if (featuresError) console.error("[admin/directory] Failed to load provider features", featuresError.message)

  return {
    countries: (countries ?? []) as CountryRow[],
    cities: (cities ?? []) as CityRow[],
    ageGroups: (ageGroups ?? []) as AgeGroupRow[],
    programTypes: (programTypes ?? []) as ProgramTypeRow[],
    languages: (languages ?? []) as LanguageRow[],
    curriculum: (curriculum ?? []) as CurriculumRow[],
    features: (features ?? []) as FeatureRow[],
  }
}

export default async function AdminDirectoryPage() {
  const initialData = await loadDirectoryData()

  return (
    <Suspense fallback={<div className="p-4">Loading directory…</div>}>
      <AdminDirectoryPageClient
        initialCountries={initialData.countries}
        initialCities={initialData.cities}
        initialAgeGroups={initialData.ageGroups}
        initialProgramTypes={initialData.programTypes}
        initialLanguages={initialData.languages}
        initialCurriculum={initialData.curriculum}
        initialFeatures={initialData.features}
      />
    </Suspense>
  )
}
