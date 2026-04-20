import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MarketId } from "@/lib/market"
import { getMarketCopy } from "@/lib/market-copy"
import { getPopularLocationsForHome } from "@/lib/popular-locations"

export function HomePopularLocationsSectionSkeleton() {
  return (
    <section id="cities" className="py-20 md:py-24" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-2 h-3 w-32 rounded bg-muted animate-pulse" />
          <div className="mx-auto mb-2 h-9 w-56 rounded bg-muted animate-pulse" />
          <div className="mx-auto h-4 w-80 max-w-full rounded bg-muted animate-pulse" />
        </div>
        <div className="rounded-3xl border border-border/60 bg-card/80 p-6 md:p-8 lg:p-10 shadow-sm">
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((col) => (
              <div key={col} className="space-y-3">
                <div className="h-6 w-24 rounded bg-muted animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((row) => (
                    <div key={row} className="h-4 w-full rounded bg-muted/80 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

type HomePopularProps = {
  market: MarketId
}

export async function HomePopularLocationsSection({ market }: HomePopularProps) {
  const copy = getMarketCopy(market)
  const popularLocations = await getPopularLocationsForHome(market)
  const isSingleCountry = popularLocations.length === 1

  return (
    <section id="cities" className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="text-center mb-10">
          <span className="mb-1 inline-block text-xs font-semibold uppercase tracking-wide text-tertiary">
            Popular locations
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
            Browse by City
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{copy.popularCitiesIntro}</p>
        </div>

        <div
          className={`rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm p-6 md:p-8 lg:p-10 ${
            isSingleCountry ? "max-w-4xl mx-auto" : ""
          }`}
        >
          <div
            className={`grid gap-8 lg:gap-12 ${
              isSingleCountry ? "md:grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {popularLocations.map((group) => (
              <div key={group.country}>
                <h3 className="text-base md:text-lg font-semibold text-foreground pb-3 mb-4 border-b border-border/60">
                  {isSingleCountry ? `${copy.label} (${group.country})` : group.country}
                </h3>
                <ul className={isSingleCountry ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
                  {group.locations.map((location, i) => (
                    <li key={location.href}>
                      <Link
                        href={location.href}
                        className={`group inline-flex items-center gap-2 text-sm md:text-base transition-colors ${
                          i % 2 === 0
                            ? "text-muted-foreground hover:text-primary"
                            : "text-muted-foreground hover:text-tertiary"
                        }`}
                      >
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${
                            i % 2 === 0
                              ? "bg-primary/5 text-primary border-primary/10"
                              : "bg-tertiary/8 text-tertiary border-tertiary/20"
                          }`}
                        >
                          <MapPin className="h-3.5 w-3.5" />
                        </span>
                        <span className="underline-offset-2 group-hover:underline">
                          {location.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/provider/locations/">
                View all locations
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
