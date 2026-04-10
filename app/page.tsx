import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import { ShieldCheck, Star, GitCompareArrows, MessageSquare, ArrowRight, Users, Clock, Award } from "lucide-react"
import { SearchBarDynamic } from "@/components/search-bar-dynamic"
import { ProgramCard } from "@/components/program-card"
import { Button } from "@/components/ui/button"
import {
  getActiveProgramTypes,
  getAgeGroupsById,
  programTypeToCardShape,
} from "@/lib/program-types"
import {
  HomeFeaturedProvidersSection,
  FeaturedProvidersSectionSkeleton,
} from "@/app/home-featured-providers"
import {
  HomePopularLocationsSection,
  HomePopularLocationsSectionSkeleton,
} from "@/app/home-popular-locations"
import {
  HomeFeaturedBlogsSection,
  HomeFeaturedBlogsSectionSkeleton,
} from "@/app/home-featured-blogs"

export const revalidate = 60

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
  { icon: Users, value: "500+", label: "Verified Providers" },
  { icon: Star, value: "2,000+", label: "Parent Reviews" },
  { icon: Clock, value: "24/7", label: "Support Available" },
  { icon: Award, value: "98%", label: "Satisfaction Rate" },
]

// Hero image quality guardrail: keep the high-resolution source unchanged.
const HOME_HERO_IMAGE_SRC =
  "https://images.pexels.com/photos/8363771/pexels-photo-8363771.jpeg?auto=compress&cs=tinysrgb&w=2200"
const HOME_HERO_IMAGE_ALT =
  "Young children learning together in an early childhood classroom"

export default async function HomePage() {
  const [programRows, ageGroupsById] = await Promise.all([
    getActiveProgramTypes(),
    getAgeGroupsById(),
  ])

  const displayPrograms = programRows
    .slice(0, 6)
    .map((row) => programTypeToCardShape(row, ageGroupsById))

  return (
    <div className="min-h-screen **:data-[slot=button]:rounded-full! [&_button]:rounded-full!">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20">
          <Image
            src={HOME_HERO_IMAGE_SRC}
            alt={HOME_HERO_IMAGE_ALT}
            fill
            priority
            className="object-cover object-[center_30%]"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/48 via-black/30 to-black/12" />
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-secondary/14 via-primary/10 to-tertiary/12" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_22%,color-mix(in_oklab,var(--tertiary)_22%,transparent),transparent_55%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_24%_28%,rgba(255,255,255,0.16),transparent_50%)]" />

        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16 md:py-20 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-3 py-1.5 text-xs md:text-sm font-medium text-white/90 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4" />
              Trusted by 100,000+ families
            </div>

            <h1 className="max-w-3xl text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.03] text-white tracking-tight mb-4 text-balance">
              The world of opportunities for{" "}
              <span className="text-secondary">kids & youngsters</span>
            </h1>

            <p className="max-w-2xl text-base md:text-xl text-white/90 leading-relaxed mb-7 text-pretty">
              Explore every kind of early childhood education, preschools, nurseries, Montessori, enrichment, and more. Search
              verified programs, read reviews, and find the right fit for your family.
            </p>

            <SearchBarDynamic surface="overlay" className="max-w-5xl" />

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

      <Suspense fallback={<FeaturedProvidersSectionSkeleton />}>
        <HomeFeaturedProvidersSection />
      </Suspense>

      {/* Browse by Program Type */}
      <section id="program-types" className="relative overflow-hidden py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-muted/25 to-background" />
        <div className="pointer-events-none absolute inset-x-0 top-8 -z-10 mx-auto h-48 w-[min(90%,72rem)] rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 mx-auto h-40 w-[min(70%,48rem)] rounded-full bg-tertiary/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 md:p-8 lg:p-10 shadow-sm backdrop-blur-sm">
            <div className="text-center mb-10">
              <span className="mb-2 inline-flex items-center rounded-full border border-tertiary/25 bg-tertiary/8 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-tertiary">
                Explore programs
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
                Browse by Program Type
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Explore age-specific options across early education—from preschools and nurseries to Montessori, enrichment, and beyond—to find the best fit for your child&apos;s stage and interests.
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

      <Suspense fallback={<HomePopularLocationsSectionSkeleton />}>
        <HomePopularLocationsSection />
      </Suspense>

      {/* Why Parents Trust Us */}
      <section className="py-20 md:py-24 bg-linear-to-b from-primary/5 via-tertiary/5 to-primary/5">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <span className="mb-1 inline-block text-xs font-semibold uppercase tracking-wide text-primary/80">
              Built for busy parents
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
              Why Parents Trust Us
            </h2>
            <p className="text-muted-foreground">
              We make finding the right early childhood fit—education, preschools, nurseries, Montessori, enrichment, and more—simple and stress-free
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustFeatures.map((feature, index) => (
              <div key={feature.title} className="text-center">
                <div
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    index % 2 === 0 ? "bg-primary/10" : "bg-tertiary/10"
                  }`}
                >
                  <feature.icon
                    className={`h-7 w-7 ${index % 2 === 0 ? "text-primary" : "text-tertiary"}`}
                  />
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

      <Suspense fallback={<HomeFeaturedBlogsSectionSkeleton />}>
        <HomeFeaturedBlogsSection />
      </Suspense>

      {/* CTA Section */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-3xl bg-primary p-8 md:p-12 text-center shadow-lg shadow-primary/25">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Are You an Early Childhood Education Provider?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join thousands of schools and programs who use Twooky to connect with local families.
              Get started in minutes, whether you&apos;re claiming an existing profile or adding a new listing.
            </p>
            <div className="mb-8 flex flex-col items-center gap-2 text-primary-foreground/80 text-sm">
              <span className="font-semibold uppercase tracking-wide text-xs opacity-90">
                Why join Twooky
              </span>
              <ul className="space-y-1">
                <li>Appear in searches from local families looking right now</li>
                <li>Showcase your programs, photos, and unique philosophy</li>
                <li>Collect reviews and build trust with your community</li>
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" className="text-white hover:text-white hover:bg-secondary/90" asChild>
                <Link href="/for-providers" className="text-inherit">
                  Get started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <Link href="/claim-listing">Claim an existing listing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
