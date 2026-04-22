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
import { SearchBarDynamic } from "@/components/search-bar-dynamic"
import { getPublicProviderTypeLabel } from "@/lib/listing-labels"
import { cities } from "@/lib/mock-data"
import {
  buildLocationHref,
  buildLocationProviderTypeHref,
  getActiveCitiesByCountryCode,
  getActiveLocationRouteParams,
  getCityByCountryAndSlug,
  resolveLegacyCitySlugToCanonical,
} from "@/lib/locations"
import { getProviderTypeBySlug, getProviderTypes } from "@/lib/provider-taxonomy"
import { getMarketFromCookies } from "@/lib/market-server"
import { getSearchPageData, type SearchPageQueryParams } from "@/lib/search-page-data"
import { buildFaqPageSchema, stringifyJsonLd } from "@/lib/schema"

interface LocationPageProps {
  params: Promise<{ segments: string[] }>
  searchParams?: Promise<SearchPageQueryParams>
}

type ParsedSegments =
  | { kind: "legacy"; legacyCity: string }
  | { kind: "city"; country: string; city: string }
  | { kind: "providerType"; country: string; city: string; providerType: string }

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
    return {
      kind: "providerType",
      country: segments[0]?.toLowerCase() ?? "",
      city: segments[1]?.toLowerCase() ?? "",
      providerType: segments[2]?.toLowerCase() ?? "",
    }
  }
  return null
}

export async function generateStaticParams() {
  try {
    const routes = await getActiveLocationRouteParams()
    const providerTypes = await getProviderTypes()
    return routes.flatMap((route) => {
      const cityRoute = { segments: [route.country, route.city] }
      const typeRoutes = providerTypes.map((type) => ({
        segments: [route.country, route.city, type.slug],
      }))
      return [cityRoute, ...typeRoutes]
    })
  } catch (e) {
    // In CI (GitHub Actions) we don't have Supabase secrets, so we can't pre-generate location routes.
    // Returning [] keeps the route dynamic and allows the build to succeed.
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.warn("[locations] generateStaticParams skipped in CI:", e)
      return []
    }
    throw e
  }
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
    const providerType = await getProviderTypeBySlug(parsed.providerType)
    if (!providerType) {
      return { title: "Location Not Found" }
    }
    const market = await getMarketFromCookies()
    const providerTypeLabel = getPublicProviderTypeLabel(providerType.name, market)
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

  const market = await getMarketFromCookies()

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
    const providerType = await getProviderTypeBySlug(parsed.providerType)
    if (!providerType) {
      notFound()
    }

    const cityName = dbCity.name
    const countryCode = parsed.country.toUpperCase()
    const providerTypeLabel = getPublicProviderTypeLabel(providerType.name, market)
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
        listTitle={`${providerTypeLabel} Providers`}
        emptyStateTitle={`No ${providerTypeLabel.toLowerCase()} providers found in ${cityName}`}
        emptyStateDescription="Try adjusting filters or explore nearby provider types in this location."
        market={market}
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
  const faqSchema = buildFaqPageSchema(cityFaqs)
  const faqJsonLd = faqSchema ? stringifyJsonLd(faqSchema) : null
  const resolvedSearchParams = searchParams ? (await searchParams) ?? {} : {}
  const { providers: cityProviders } = await getSearchPageData({
    searchParams: resolvedSearchParams,
    forcedCountryCode: parsed.country,
    forcedCityName: dbCity.name,
    forcedLocationText: dbCity.name,
  })
  const countryCities = await getActiveCitiesByCountryCode(parsed.country)
  const providerTypes = await getProviderTypes()

  return (
    <div className="min-h-screen bg-background">
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqJsonLd }}
        />
      ) : null}
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
            Find and compare {cityProviders.length}+ verified childcare providers in {displayName}. Read real
            parent reviews, compare programs, and connect with top-rated daycare centers near you.
          </p>
          <SearchBarDynamic className="max-w-3xl" />
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
            {providerTypes.map((type) => (
              <Link
                key={type.slug}
                href={buildLocationProviderTypeHref(parsed.country, parsed.city, type.slug)}
                className="group"
              >
                <Card className="h-full border-border/60 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                  <CardContent className="p-5">
                    <p className="font-semibold text-foreground">
                      {getPublicProviderTypeLabel(type.name, market)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {`See ${getPublicProviderTypeLabel(type.name, market).toLowerCase()} options in ${displayName}`}
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
              {cityProviders.slice(0, 6).map((provider) => (
                <ProviderCard key={provider.id} provider={provider} market={market} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No active providers are currently listed for this city.
              </CardContent>
            </Card>
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
