import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProviderCard } from "@/components/provider-card"
import { Button } from "@/components/ui/button"
import { selectFeaturedProviders } from "@/lib/featured-providers-selection"
import {
  activeProviderRowToCardData,
  getActiveProvidersFromDb,
} from "@/lib/search-providers-db"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

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

export async function HomeFeaturedProvidersSection() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const activeProviderRows = await getActiveProvidersFromDb(getSupabaseAdminClient())
  const featuredProviders = selectFeaturedProviders(activeProviderRows, {
    visitorGeo: null,
    limit: 3,
  }).map((provider) => activeProviderRowToCardData(provider, baseUrl))

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
            <p className="text-muted-foreground">
              Top-rated childcare centers loved by local families
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/search">
              View all providers
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProviders.length > 0 ? (
            featuredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} featured />
            ))
          ) : (
            <p className="col-span-full rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-10 text-center text-muted-foreground">
              No featured providers available right now.
            </p>
          )}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Button asChild>
            <Link href="/search">View all providers</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
