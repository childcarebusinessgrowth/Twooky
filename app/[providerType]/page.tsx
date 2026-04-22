import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { SearchResults } from "@/components/search-results"
import { getPublicProviderTypeLabel } from "@/lib/listing-labels"
import { getProviderTypeBySlug, getProviderTypes } from "@/lib/provider-taxonomy"
import { getMarketFromCookies } from "@/lib/market-server"
import { getSearchPageData, type SearchPageQueryParams } from "@/lib/search-page-data"
import { resolveProviderTypeSlug } from "@/lib/provider-type-normalization"

type PageProps = {
  params: Promise<{ providerType: string }>
  searchParams?: Promise<SearchPageQueryParams>
}

function buildTitle(name: string): string {
  return `${name} Near You | Twooky`
}

function buildDescription(name: string, categoryName: string): string {
  return `Browse verified ${name.toLowerCase()} providers in Twooky. Compare ratings, fees, availability, and parent reviews across the ${categoryName.toLowerCase()} category.`
}

export async function generateStaticParams() {
  const providerTypes = await getProviderTypes()
  return providerTypes.map((providerType) => ({
    providerType: providerType.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { providerType: rawSlug } = await params
  const providerTypes = await getProviderTypes()
  const resolvedSlug = resolveProviderTypeSlug(rawSlug, providerTypes)
  const providerType = resolvedSlug ? await getProviderTypeBySlug(resolvedSlug) : null

  if (!providerType) {
    return {
      title: "Provider Type Not Found | Twooky",
      description: "The provider type you requested could not be found.",
    }
  }

  const market = await getMarketFromCookies()
  const providerTypeLabel = getPublicProviderTypeLabel(providerType.name, market)

  return {
    title: buildTitle(providerTypeLabel),
    description: buildDescription(providerTypeLabel, providerType.category_name),
    alternates: {
      canonical: `/${providerType.slug}`,
    },
  }
}

export default async function ProviderTypePage({ params, searchParams }: PageProps) {
  const { providerType: rawSlug } = await params
  const providerTypes = await getProviderTypes()
  const resolvedSlug = resolveProviderTypeSlug(rawSlug, providerTypes)
  if (!resolvedSlug) notFound()

  if (resolvedSlug !== rawSlug) {
    permanentRedirect(`/${resolvedSlug}`)
  }

  const providerType = await getProviderTypeBySlug(resolvedSlug)
  if (!providerType) notFound()
  const market = await getMarketFromCookies()
  const providerTypeLabel = getPublicProviderTypeLabel(providerType.name, market)

  const resolvedSearchParams = (await searchParams) ?? {}
  const { providers, filterOptions } = await getSearchPageData({
    searchParams: resolvedSearchParams,
    forcedProviderType: providerType.slug,
  })

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-linear-to-b from-primary/10 via-background to-background py-10 md:py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
            {providerType.category_name}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {providerTypeLabel} Near You
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">
            Explore verified {providerTypeLabel.toLowerCase()} providers from our live directory and compare reviews,
            fees, and availability before you get in touch.
          </p>
        </div>
      </section>

      <SearchResults
        providers={providers}
        filterOptions={filterOptions}
        basePath={`/${providerType.slug}`}
        defaultProviderType={providerType.slug}
        headerTitle={`${providerTypeLabel} Near You`}
        listTitle={`${providerTypeLabel} providers`}
        emptyStateTitle={`No ${providerTypeLabel.toLowerCase()} providers found`}
        emptyStateDescription="Try broadening your search radius or removing a few filters to see more results."
        market={market}
      />
    </div>
  )
}
