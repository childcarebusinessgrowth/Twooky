"use client"

import { useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FolderTree } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLocationsClient } from "@/app/admin/locations/pageClient"
import { AdminAgeGroupsPageClient } from "@/app/admin/age-groups/pageClient"
import { AdminProgramTypesPageClient } from "@/app/admin/program-types/pageClient"
import { AdminLanguagesPageClient } from "@/app/admin/languages/pageClient"
import { AdminCurriculumPageClient } from "@/app/admin/curriculum/pageClient"
import { AdminFeaturesPageClient } from "@/app/admin/features/pageClient"
import { AdminCurrenciesPageClient } from "@/app/admin/currencies/pageClient"

const TAB_VALUES = [
  "locations",
  "age-groups",
  "program-types",
  "languages",
  "curriculum",
  "features",
  "currencies",
] as const

type TabValue = (typeof TAB_VALUES)[number]

function isValidTab(value: string | null): value is TabValue {
  return value !== null && TAB_VALUES.includes(value as TabValue)
}

function getTabFromSearchParams(searchParams: URLSearchParams): TabValue {
  const tab = searchParams.get("tab")
  return isValidTab(tab) ? tab : "locations"
}

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
  tag: string
  age_range: string
  sort_order: number
  is_active: boolean
}

type ProgramTypeRow = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  age_group_ids: string[] | null
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

type CurrencyRow = {
  id: string
  code: string
  name: string
  symbol: string
  sort_order: number
  is_active: boolean
}

type AdminDirectoryPageClientProps = {
  initialCountries: CountryRow[]
  initialCities: CityRow[]
  initialAgeGroups: AgeGroupRow[]
  initialProgramTypes: ProgramTypeRow[]
  initialLanguages: LanguageRow[]
  initialCurriculum: CurriculumRow[]
  initialFeatures: FeatureRow[]
  initialCurrencies: CurrencyRow[]
}

export function AdminDirectoryPageClient({
  initialCountries,
  initialCities,
  initialAgeGroups,
  initialProgramTypes,
  initialLanguages,
  initialCurriculum,
  initialFeatures,
  initialCurrencies,
}: AdminDirectoryPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab = getTabFromSearchParams(searchParams)

  const handleTabChange = useCallback(
    (value: string) => {
      const next = value as TabValue
      const url = new URL(window.location.href)
      url.searchParams.set("tab", next)
      router.replace(url.pathname + "?" + url.searchParams.toString(), { scroll: false })
    },
    [router],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FolderTree className="h-6 w-6" />
          Directory
        </h1>
        <p className="text-muted-foreground">
          Manage locations, age groups, program types, languages, curriculum, provider features, and currencies used across the directory.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="age-groups">Age groups</TabsTrigger>
          <TabsTrigger value="program-types">Program types</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="features">Provider features</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4 mt-4">
          <AdminLocationsClient
            initialCountries={initialCountries}
            initialCities={initialCities}
          />
        </TabsContent>

        <TabsContent value="age-groups" className="space-y-4 mt-4">
          <AdminAgeGroupsPageClient initialAgeGroups={initialAgeGroups} />
        </TabsContent>

        <TabsContent value="program-types" className="space-y-4 mt-4">
          <AdminProgramTypesPageClient
            initialProgramTypes={initialProgramTypes}
            initialAgeGroups={initialAgeGroups}
          />
        </TabsContent>

        <TabsContent value="languages" className="space-y-4 mt-4">
          <AdminLanguagesPageClient initialLanguages={initialLanguages} />
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4 mt-4">
          <AdminCurriculumPageClient initialCurriculum={initialCurriculum} />
        </TabsContent>

        <TabsContent value="features" className="space-y-4 mt-4">
          <AdminFeaturesPageClient initialFeatures={initialFeatures} />
        </TabsContent>

        <TabsContent value="currencies" className="space-y-4 mt-4">
          <AdminCurrenciesPageClient initialCurrencies={initialCurrencies} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
