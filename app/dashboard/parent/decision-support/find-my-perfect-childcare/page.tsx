import { ProviderCard } from "@/components/provider-card"
import {
  getSearchPageData,
  getSearchFilterOptions,
  type SearchPageQueryParams,
} from "@/lib/search-page-data"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { FindMyPerfectChildcareQuiz } from "./find-my-perfect-childcare-quiz"

type PageProps = {
  searchParams: Promise<{
    country?: string
    city?: string
    ageGroup?: string
    programType?: string
    language?: string
    minFee?: string
    maxFee?: string
  }>
}

type CountryOption = {
  code: string
  name: string
}

type CityOption = {
  name: string
  countryCode: string
}

async function getLocationQuizOptions(): Promise<{
  countries: CountryOption[]
  cities: CityOption[]
}> {
  const supabase = getSupabaseAdminClient()
  const [{ data: countries }, { data: citiesRaw }] = await Promise.all([
    supabase
      .from("countries")
      .select("id, code, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("cities")
      .select("name, country_id")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ])

  const countryCodeById = new Map<string, string>()

  const normalizedCountries = (countries ?? [])
    .map((row) => {
      const code = String(row.code ?? "").trim().toUpperCase()
      if (row.id && code) {
        countryCodeById.set(String(row.id), code)
      }
      return {
        code,
        name: String(row.name ?? "").trim(),
      }
    })
    .filter((row) => row.code && row.name)

  const normalizedCities = (citiesRaw ?? [])
    .map((row) => {
      const countryCode = countryCodeById.get(String(row.country_id ?? "")) ?? ""
      return {
        name: String(row.name ?? "").trim(),
        countryCode,
      }
    })
    .filter((row) => row.name && row.countryCode)

  const uniqueCities = new Map<string, CityOption>()
  for (const city of normalizedCities) {
    const key = `${city.countryCode}-${city.name.toLowerCase()}`
    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, city)
    }
  }

  return {
    countries: normalizedCountries,
    cities: Array.from(uniqueCities.values()),
  }
}

function normalizeSelection(value?: string): string {
  return typeof value === "string" ? value.trim() : ""
}

export const metadata = {
  title: "Find My Perfect Childcare | Twooky",
  description: "Take a quick quiz and discover the childcare providers that best fit your family.",
}

export default async function ParentDecisionSupportFindMyPerfectChildcarePage({
  searchParams,
}: PageProps) {
  const params = await searchParams
  const [filterOptions, locationOptions] = await Promise.all([
    getSearchFilterOptions(),
    getLocationQuizOptions(),
  ])

  const selectedCountry = normalizeSelection(params.country).toUpperCase()
  const selectedCity = normalizeSelection(params.city)
  const selectedAgeGroup = normalizeSelection(params.ageGroup)
  const selectedProgramType = normalizeSelection(params.programType)
  const selectedLanguage = normalizeSelection(params.language)
  const selectedMinFee = normalizeSelection(params.minFee)
  const selectedMaxFee = normalizeSelection(params.maxFee)

  const validCountryCodes = new Set(locationOptions.countries.map((country) => country.code))
  const validCountry = validCountryCodes.has(selectedCountry) ? selectedCountry : ""

  const validCity = locationOptions.cities.some(
    (city) => city.countryCode === validCountry && city.name.toLowerCase() === selectedCity.toLowerCase(),
  )
    ? selectedCity
    : ""

  const validAgeGroup = filterOptions.ageGroups.some((option) => option.value === selectedAgeGroup)
    ? selectedAgeGroup
    : ""
  const validProgramType = filterOptions.programTypes.some((option) => option.value === selectedProgramType)
    ? selectedProgramType
    : ""
  const validLanguage = filterOptions.languages.some((option) => option.value === selectedLanguage)
    ? selectedLanguage
    : ""

  const hasRequiredQuizAnswers = Boolean(validCountry && validCity && validAgeGroup)

  let providers: Awaited<ReturnType<typeof getSearchPageData>>["providers"] = []
  if (hasRequiredQuizAnswers) {
    const quizSearchParams: SearchPageQueryParams = {
      ageGroups: validAgeGroup,
      programTypes: validProgramType || undefined,
      languages: validLanguage || undefined,
      minFee: selectedMinFee || undefined,
      maxFee: selectedMaxFee || undefined,
    }

    const searchData = await getSearchPageData({
      searchParams: quizSearchParams,
      forcedCountryCode: validCountry,
      forcedCityName: validCity,
      forcedLocationText: validCity,
    })
    providers = searchData.providers
  }

  return (
    <div className="space-y-6">
      <FindMyPerfectChildcareQuiz
        countries={locationOptions.countries}
        cities={locationOptions.cities}
        ageGroupOptions={filterOptions.ageGroups}
        programTypeOptions={filterOptions.programTypes}
        languageOptions={filterOptions.languages}
        currencySymbol={filterOptions.currencySymbol ?? "$"}
        initialValues={{
          country: validCountry,
          city: validCity,
          ageGroup: validAgeGroup,
          programType: validProgramType,
          language: validLanguage,
          minFee: selectedMinFee,
          maxFee: selectedMaxFee,
        }}
        hasSubmitted={hasRequiredQuizAnswers}
        resultCount={providers.length}
      />

      {hasRequiredQuizAnswers ? (
        <section className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card px-6 py-5">
            <h3 className="text-lg font-semibold text-foreground">Your best matches</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked providers for {validCity}, {validCountry} based on your quiz answers.
            </p>
          </div>

          {providers.length > 0 ? (
            <div className="space-y-5">
              {providers.slice(0, 12).map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  layout="horizontal"
                  featured={provider.featured}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
              <h3 className="text-base font-semibold text-foreground">No providers matched yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening your budget or changing program and language preferences.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
