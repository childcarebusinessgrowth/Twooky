import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { MapPin, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ProviderCard } from "@/components/provider-card"
import { SearchResults } from "@/components/search-results"
import { StatsSection } from "@/components/stats-section"
import { SearchBarDynamic } from "@/components/search-bar-dynamic"
import { providers, cityStats, cities } from "@/lib/mock-data"
import {
  buildLocationHref,
  buildLocationProviderTypeHref,
  getActiveCitiesByCountryCode,
  getActiveLocationRouteParams,
  getCityByCountryAndSlug,
  resolveLegacyCitySlugToCanonical,
} from "@/lib/locations"
import { getProviderTypeById, PROVIDER_TYPES, type ProviderTypeId } from "@/lib/provider-types"
import { getSearchPageData, type SearchPageQueryParams } from "@/lib/search-page-data"

interface LocationPageProps {
  params: Promise<{ segments: string[] }>
  searchParams?: Promise<SearchPageQueryParams>
}

type ParsedSegments =
  | { kind: "legacy"; legacyCity: string }
  | { kind: "city"; country: string; city: string }
  | { kind: "providerType"; country: string; city: string; providerType: ProviderTypeId }

const PROVIDER_TYPE_IDS = new Set<ProviderTypeId>(PROVIDER_TYPES.map((type) => type.id))

function parseSegments(segments: string[]): ParsedSegments | null {
  if (segments.length === 1) {
    return { kind: "legacy", legacyCity: segments[0]?.toLowerCase() ?? "" }
  }
  if (segments.length === 2) {
    return {
      kind: "city",
      country: segments[0]?.toLowerCase() ?? "",
      city: segments[1]?.toLowerCase() ?? "",
    }
  }
  if (segments.length === 3) {
    const providerType = (segments[2]?.toLowerCase() ?? "") as ProviderTypeId
    if (!PROVIDER_TYPE_IDS.has(providerType)) {
      return null
    }
    return {
      kind: "providerType",
      country: segments[0]?.toLowerCase() ?? "",
      city: segments[1]?.toLowerCase() ?? "",
      providerType,
    }
  }
  return null
}

function getProviderTypeSeoLabel(typeId: ProviderTypeId): string {
  const map: Record<ProviderTypeId, string> = {
    nursery: "Nurseries",
    preschool: "Preschools",
    afterschool_program: "Afterschool Programs",
    sports_academy: "Sports Academies",
    holiday_camp: "Holiday Camps",
    tutoring: "Tutoring Services",
    therapy_service: "Therapy Services",
  }
  return map[typeId]
}

export async function generateStaticParams() {
  const routes = await getActiveLocationRouteParams()
  return routes.flatMap((route) => {
    const cityRoute = { segments: [route.country, route.city] }
    const typeRoutes = PROVIDER_TYPES.map((type) => ({
      segments: [route.country, route.city, type.id],
    }))
    return [cityRoute, ...typeRoutes]
  })
}

export async function generateMetadata({ params }: LocationPageProps) {
  const { segments } = await params
  const parsed = parseSegments(segments)
  if (!parsed) {
    return { title: "Location Not Found" }
  }

  if (parsed.kind === "legacy") {
    const canonical = await resolveLegacyCitySlugToCanonical(parsed.legacyCity)
    return {
      title: "Location moved",
      robots: {
        index: false,
        follow: true,
      },
      alternates: canonical
        ? {
            canonical: buildLocationHref(canonical.country, canonical.city),
          }
        : undefined,
    }
  }

  const dbCity = await getCityByCountryAndSlug(parsed.country, parsed.city)
  if (!dbCity) {
    return { title: "Location Not Found" }
  }

  const fallbackCity = cities.find((c) => c.slug === parsed.city)
  const cityName = fallbackCity?.name ?? dbCity.name
  const cityState = fallbackCity?.state ?? ""
  const providerCount = fallbackCity?.providerCount ?? 0

  if (parsed.kind === "providerType") {
    const providerType = getProviderTypeById(parsed.providerType)
    if (!providerType) {
      return { title: "Location Not Found" }
    }
    const providerTypeLabel = getProviderTypeSeoLabel(parsed.providerType)
    const countryCode = parsed.country.toUpperCase()
    const canonicalPath = buildLocationProviderTypeHref(parsed.country, parsed.city, parsed.providerType)
    return {
      title: `Best ${providerTypeLabel} in ${cityName}, ${countryCode} | Twooky`,
      description: `Explore top-rated ${providerTypeLabel.toLowerCase()} in ${cityName}, ${countryCode}. Compare verified providers, read parent reviews, and find the right fit for your family.`,
      alternates: {
        canonical: canonicalPath,
      },
    }
  }

  const canonicalPath = buildLocationHref(parsed.country, parsed.city)
  return {
    title: `Best Daycare in ${cityName}${cityState ? `, ${cityState}` : ""} | Twooky`,
    description: `Find top-rated daycare centers, preschools, and childcare providers in ${cityName}${
      cityState ? `, ${cityState}` : ""
    }. Compare ${providerCount}+ verified providers.`,
    alternates: {
      canonical: canonicalPath,
    },
  }
}

const cityFaqs = [
  {
    question: "How much does daycare cost in this area?",
    answer:
      "Daycare costs vary based on the type of care, age of child, and hours needed. In this area, full-time infant care typically ranges from $1,200-$2,000/month, while preschool programs range from $900-$1,500/month.",
  },
  {
    question: "What should I look for when choosing a daycare?",
    answer:
      "Key factors include: licensing and accreditation, staff qualifications and ratios, curriculum approach, safety measures, cleanliness, location convenience, schedule flexibility, and parent communication practices.",
  },
  {
    question: "How do I know if a daycare is licensed?",
    answer:
      "All licensed childcare providers in this state are listed in the state licensing database. You can verify any provider's license status, inspection history, and any violations through the state childcare licensing website.",
  },
  {
    question: "What age can my child start daycare?",
    answer:
      "Many daycare centers accept infants as young as 6 weeks old. However, availability for infant care is limited due to lower ratios. Some parents prefer to wait until 3-6 months or longer before starting childcare.",
  },
  {
    question: "How far in advance should I apply?",
    answer:
      "We recommend starting your search 3-6 months before you need care. Quality programs often have waitlists, especially for infant and toddler spots. Some families apply even before their baby is born.",
  },
]

const nearbySearches = [
  "Infant daycare near me",
  "Affordable preschools",
  "Montessori schools",
  "Part-time childcare",
  "Bilingual daycare",
  "Special needs programs",
]

export default async function LocationPage({ params, searchParams }: LocationPageProps) {
  const { segments } = await params
  const parsed = parseSegments(segments)
  if (!parsed) {
    notFound()
  }

  if (parsed.kind === "legacy") {
    const canonical = await resolveLegacyCitySlugToCanonical(parsed.legacyCity)
    if (!canonical) {
      notFound()
    }
    permanentRedirect(buildLocationHref(canonical.country, canonical.city))
  }

  const countrySegment = segments[0] ?? ""
  const citySegment = segments[1] ?? ""

  if (parsed.kind === "city" || parsed.kind === "providerType") {
    if (countrySegment !== parsed.country || citySegment !== parsed.city) {
      permanentRedirect(buildLocationHref(parsed.country, parsed.city))
    }
  }

  if (parsed.kind === "providerType") {
    const providerTypeSegment = segments[2] ?? ""
    if (providerTypeSegment !== parsed.providerType) {
      permanentRedirect(buildLocationProviderTypeHref(parsed.country, parsed.city, parsed.providerType))
    }

    const dbCity = await getCityByCountryAndSlug(parsed.country, parsed.city)
    if (!dbCity) {
      notFound()
    }
    const providerType = getProviderTypeById(parsed.providerType)
    if (!providerType) {
      notFound()
    }

    const cityName = dbCity.name
    const countryCode = parsed.country.toUpperCase()
    const providerTypeLabel = getProviderTypeSeoLabel(parsed.providerType)
    const headerTitle = `Best ${providerTypeLabel} in ${cityName}, ${countryCode}`
    const resolvedSearchParams = searchParams ? (await searchParams) ?? {} : {}
    const { providers, filterOptions } = await getSearchPageData({
      searchParams: resolvedSearchParams,
      forcedProviderType: parsed.providerType,
      forcedCountryCode: parsed.country,
      forcedCityName: cityName,
      forcedLocationText: cityName,
    })

    return (
      <SearchResults
        providers={providers}
        filterOptions={filterOptions}
        basePath={buildLocationProviderTypeHref(parsed.country, parsed.city, parsed.providerType)}
        defaultProviderType={parsed.providerType}
        headerTitle={headerTitle}
        listTitle={`${providerType.label} Providers`}
        emptyStateTitle={`No ${providerType.label.toLowerCase()} providers found in ${cityName}`}
        emptyStateDescription="Try adjusting filters or explore nearby provider types in this location."
      />
    )
  }

  const dbCity = await getCityByCountryAndSlug(parsed.country, parsed.city)
  if (!dbCity) {
    notFound()
  }

  const city = cities.find((c) => c.slug === parsed.city)
  const displayName = city?.name ?? dbCity.name ?? parsed.city
  const state = city?.state
  const stats = cityStats[parsed.city as keyof typeof cityStats] ?? {
    averageCost: "N/A",
    totalProviders: 0,
    topRated: 0,
    waitlistAvg: "N/A",
  }
  const cityProviders = providers.filter((p) => p.city.toLowerCase() === displayName.toLowerCase())
  const countryCities = await getActiveCitiesByCountryCode(parsed.country)

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-linear-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <MapPin className="h-4 w-4" />
            <span>
              {displayName}
              {state ? `, ${state}` : ""}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Best Daycare in {displayName}
            {state ? `, ${state}` : ""}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mb-8">
            Find and compare {city?.providerCount ?? 0}+ verified childcare providers in {displayName}. Read real
            parent reviews, compare programs, and connect with top-rated daycare centers near you.
          </p>
          <SearchBarDynamic className="max-w-3xl" />
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <StatsSection stats={stats} cityName={displayName} />
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Browse by Provider Type in {displayName}</h2>
            <p className="text-muted-foreground mt-2">
              Explore provider categories in this city and view SEO-optimized listings by location and type.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROVIDER_TYPES.map((type) => (
              <Link
                key={type.id}
                href={buildLocationProviderTypeHref(parsed.country, parsed.city, type.id)}
                className="group"
              >
                <Card className="h-full border-border/60 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                  <CardContent className="p-5">
                    <p className="font-semibold text-foreground">{getProviderTypeSeoLabel(type.id)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {type.description ?? `See ${type.label.toLowerCase()} options in ${displayName}`}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Top Providers in {displayName}</h2>
              <p className="text-muted-foreground">Highest-rated childcare centers loved by local families</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href={`/search?location=${parsed.city}`}>
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {cityProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cityProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.slice(0, 3).map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Button asChild>
              <Link href={`/search?location=${parsed.city}`}>View all providers</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <Card>
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {cityFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular Searches in {displayName}</h2>
          <div className="flex flex-wrap gap-3">
            {nearbySearches.map((search) => (
              <Link
                key={search}
                href={`/search?location=${parsed.city}&q=${encodeURIComponent(search)}`}
                className="px-4 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {search}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Browse Other Cities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {countryCities
              .filter((c) => c.slug !== parsed.city)
              .slice(0, 15)
              .map((otherCity) => (
                <Link
                  key={otherCity.slug}
                  href={buildLocationHref(otherCity.country, otherCity.slug)}
                  className="p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors text-center"
                >
                  <p className="font-medium text-foreground">{otherCity.name}</p>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}
