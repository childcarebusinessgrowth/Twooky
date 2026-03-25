import Link from "next/link"
import Image from "next/image"
import { headers } from "next/headers"
import { ShieldCheck, Star, GitCompareArrows, MessageSquare, ArrowRight, Users, Clock, Award, MapPin } from "lucide-react"
import { SearchBar } from "@/components/search-bar"
import { ProviderCard } from "@/components/provider-card"
import { ProgramCard } from "@/components/program-card"
import { Button } from "@/components/ui/button"
import {
  getActiveProgramTypes,
  getAgeGroupsById,
  programTypeToCardShape,
} from "@/lib/program-types"
import { getRecentPublishedBlogs } from "@/lib/blogs"
import { getPopularLocationsForHome } from "@/lib/popular-locations"
import { selectFeaturedProviders } from "@/lib/featured-providers-selection"
import { activeProviderRowToCardData, getActiveProvidersFromDb } from "@/lib/search-providers-db"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { parseVisitorGeoFromHeaders } from "@/lib/visitor-geo"

export const dynamic = "force-dynamic"

const trustFeatures = [
  {
    icon: ShieldCheck,
    title: "Verified Providers",
    description: "All providers are background checked and licensed"
  },
  {
    icon: Star,
    title: "Real Parent Reviews",
    description: "Honest reviews from families like yours"
  },
  {
    icon: GitCompareArrows,
    title: "Compare Programs",
    description: "Side-by-side comparison of programs and pricing"
  },
  {
    icon: MessageSquare,
    title: "Easy Contact",
    description: "Connect directly with providers instantly"
  }
]

const heroStats = [
  { icon: Users, value: "10,000+", label: "Verified Providers" },
  { icon: Star, value: "50,000+", label: "Parent Reviews" },
  { icon: Clock, value: "24/7", label: "Support Available" },
  { icon: Award, value: "98%", label: "Satisfaction Rate" },
]

export default async function HomePage() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const supabase = getSupabaseAdminClient()
  const visitorGeo = parseVisitorGeoFromHeaders(await headers())

  const [programRows, ageGroupsById, activeProviderRows, featuredBlogs, popularLocations] = await Promise.all([
    getActiveProgramTypes(),
    getAgeGroupsById(),
    getActiveProvidersFromDb(supabase),
    getRecentPublishedBlogs(3),
    getPopularLocationsForHome(),
  ])

  const featuredProviders = selectFeaturedProviders(activeProviderRows, {
    visitorGeo,
    limit: 3,
  }).map((provider) => activeProviderRowToCardData(provider, baseUrl))

  const displayPrograms = programRows
    .slice(0, 6)
    .map((row) => programTypeToCardShape(row, ageGroupsById))

  return (
    <div className="min-h-screen **:data-[slot=button]:rounded-full! [&_button]:rounded-full!">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <Image
            src="https://images.pexels.com/photos/8363771/pexels-photo-8363771.jpeg?auto=compress&cs=tinysrgb&w=2200"
            alt="Happy nursery children smiling at the camera in a classroom"
            fill
            priority
            className="object-cover object-[center_30%]"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/48 via-black/30 to-black/12" />
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-amber-500/14 via-primary/7 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_24%_28%,rgba(255,255,255,0.16),transparent_50%)]" />

        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16 md:py-20 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-3 py-1.5 text-xs md:text-sm font-medium text-white/90 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4" />
              Trusted by 100,000+ families
            </div>

            <h1 className="max-w-3xl text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.03] text-white tracking-tight mb-4 text-balance">
              Find trusted <span className="text-white">Childcare</span> near you
            </h1>

            <p className="max-w-2xl text-base md:text-xl text-white/90 leading-relaxed mb-7 text-pretty">
              Search thousands of licensed providers. Read reviews, compare tuition, and find the perfect fit for your family.
            </p>

            <SearchBar surface="overlay" className="max-w-5xl" />

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-white/40 bg-white/10 p-3.5 text-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:bg-white/16 hover:shadow-[0_14px_34px_rgba(0,0,0,0.34)]"
                >
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/60 bg-white/15">
                    <stat.icon className="h-4 w-4 text-secondary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="text-2xl leading-none font-extrabold tracking-tight">{stat.value}</div>
                  <div className="mt-1 text-[11px] md:text-xs font-medium text-white/85">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
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

      {/* Browse by Program Type */}
      <section id="program-types" className="relative overflow-hidden py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-muted/25 to-background" />
        <div className="pointer-events-none absolute inset-x-0 top-8 -z-10 mx-auto h-48 w-[min(90%,72rem)] rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 md:p-8 lg:p-10 shadow-sm backdrop-blur-sm">
            <div className="text-center mb-10">
              <span className="mb-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary/80">
                Explore programs
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
                Browse by Program Type
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Explore age-specific and learning-focused options to find the best fit for your child&apos;s stage and needs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayPrograms.length > 0 ? (
                displayPrograms.map((program) => (
                  <ProgramCard key={program.id} program={program} compact />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No program types available at the moment.
                </p>
              )}
            </div>

            <div className="mt-8 text-center">
              <Button variant="outline" asChild className="rounded-full px-6">
                <Link href="/programs">
                  View all programs
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by City / Popular Locations */}
      <section id="cities" className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-10">
            <span className="mb-1 inline-block text-xs font-semibold uppercase tracking-wide text-primary/80">
              Popular locations
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
              Browse by City
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover trusted nurseries and childcare in the most popular cities across the USA, UK and UAE.
            </p>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm p-6 md:p-8 lg:p-10">
            <div className="grid gap-8 lg:gap-12 md:grid-cols-3">
              {popularLocations.map((group) => (
                <div key={group.country}>
                  <h3 className="text-base md:text-lg font-semibold text-foreground pb-3 mb-4 border-b border-border/60">
                    {group.country}
                  </h3>
                  <ul className="space-y-3">
                    {group.locations.map((location) => (
                      <li key={location.href}>
                        <Link
                          href={location.href}
                          className="group inline-flex items-center gap-2 text-sm md:text-base text-muted-foreground hover:text-primary transition-colors"
                        >
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/5 text-primary border border-primary/10">
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
                <Link href="/childcare/locations/">
                  View all locations
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Parents Trust Us */}
      <section className="py-20 md:py-24 bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <span className="mb-1 inline-block text-xs font-semibold uppercase tracking-wide text-primary/80">
              Built for busy parents
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
              Why Parents Trust Us
            </h2>
            <p className="text-muted-foreground">
              We make finding quality childcare simple and stress-free
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustFeatures.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Blogs */}
      <section className="py-20 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary/80">
                From our blog
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
                Featured Articles for Parents
              </h2>
              <p className="text-muted-foreground max-w-xl">
                Short, practical reads to help you compare programs, prepare for tours, and support big transitions.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/blogs">
                  View all articles
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBlogs.map((post) => (
              <Link
                key={post.slug}
                href={`/blogs/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card hover:bg-background/80 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/10 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-4 md:p-5">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readingTime}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Parent guide
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    <span>Read article</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="bg-primary rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Are You a Childcare Provider?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of providers who use Early Learning Directory to connect with local families. 
              Claim your free listing today and start growing your enrollment.
            </p>
            <div className="mb-8 flex flex-col items-center gap-2 text-primary-foreground/80 text-sm">
              <span className="font-semibold uppercase tracking-wide text-xs opacity-90">
                Why join Early Learning Directory
              </span>
              <ul className="space-y-1">
                <li>Appear in searches from local families looking right now</li>
                <li>Showcase your programs, photos, and unique philosophy</li>
                <li>Collect reviews and build trust with your community</li>
              </ul>
            </div>
            <Button size="lg" variant="secondary" className="text-white hover:text-white hover:bg-secondary/90" asChild>
              <Link href="/claim-listing" className="text-inherit">
                Claim Your Listing
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
