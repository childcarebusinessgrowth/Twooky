import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HomeFeaturedProvidersClient } from "@/components/home-featured-providers-client"
import { selectFeaturedProviders } from "@/lib/featured-providers-selection"
import type { MarketId } from "@/lib/market"
import { marketToVisitorCountryCode, normalizeCountryCode, visitorGeoForMarket } from "@/lib/market"
import { getMarketCopy } from "@/lib/market-copy"
import {
  activeProviderRowToCardData,
  getActiveProvidersFromDbCached,
} from "@/lib/search-providers-db"

export function FeaturedProvidersSectionSkeleton() {
  return (
    <section id="featured-providers" className="py-20 md:py-24" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div className="space-y-2">
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
            <div className="h-8 w-56 max-w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-72 max-w-full rounded bg-muted animate-pulse" />
          </div>
          <div className="hidden h-10 w-40 rounded-md bg-muted animate-pulse md:block" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[320px] rounded-2xl border border-border/60 bg-muted/30 animate-pulse"
            />
          ))}
        </div>
        <div className="mt-8 flex justify-center md:hidden">
          <div className="h-10 w-40 rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    </section>
  )
}

type HomeFeaturedProps = {
  market: MarketId
}

export async function HomeFeaturedProvidersSection({ market }: HomeFeaturedProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const copy = getMarketCopy(market)
  const visitorGeo = visitorGeoForMarket(market)
  const marketCountryCode = marketToVisitorCountryCode(market)

  const activeProviderRows = await getActiveProvidersFromDbCached()
  let featuredProviders = selectFeaturedProviders(activeProviderRows, {
    visitorGeo,
    enforceVisitorCountry: true,
    limit: 3,
  }).map((provider) => activeProviderRowToCardData(provider, baseUrl))

  if (featuredProviders.length === 0) {
    if (marketCountryCode) {
      featuredProviders = activeProviderRows
        .filter(
          (row) =>
            row.featured &&
            normalizeCountryCode(row.country_code) === marketCountryCode,
        )
        .sort((a, b) => {
          const ratingDiff = (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
          if (ratingDiff !== 0) return ratingDiff
          const reviewDiff = (b.review_count ?? 0) - (a.review_count ?? 0)
          if (reviewDiff !== 0) return reviewDiff
          return (a.business_name ?? "").localeCompare(b.business_name ?? "")
        })
        .slice(0, 3)
        .map((provider) => activeProviderRowToCardData(provider, baseUrl))
    } else {
      featuredProviders = selectFeaturedProviders(activeProviderRows, {
        visitorGeo: null,
        limit: 3,
      }).map((provider) => activeProviderRowToCardData(provider, baseUrl))
    }
  }

  return (
    <section id="featured-providers" className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary/80">
              Top picks near you
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
              Featured Providers
            </h2>
            <p className="text-muted-foreground">{copy.featuredProvidersSubtitle}</p>
            <p className="mt-1 text-xs text-muted-foreground/90">{copy.regulationTrustLine}</p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/search">
              View all providers
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <HomeFeaturedProvidersClient initialProviders={featuredProviders} market={market} />

        <div className="mt-8 text-center md:hidden">
          <Button asChild>
            <Link href="/search">View all providers</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
