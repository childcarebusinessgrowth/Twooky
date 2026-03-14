import Link from "next/link"
import { notFound } from "next/navigation"
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
import { StatsSection } from "@/components/stats-section"
import { SearchBar } from "@/components/search-bar"
import { providers, cityStats, cities } from "@/lib/mock-data"
import { getCityBySlug } from "@/lib/locations"

interface LocationPageProps {
  params: Promise<{ city: string }>
}

export async function generateStaticParams() {
  const dbCities = cities

  return dbCities.map((city) => ({
    city: city.slug,
  }))
}

export async function generateMetadata({ params }: LocationPageProps) {
  const { city: citySlug } = await params
  const dbCity = await getCityBySlug(citySlug)

  if (!dbCity) {
    return { title: "Location Not Found" }
  }

  const fallbackCity = cities.find((c) => c.slug === citySlug)
  const cityName = fallbackCity?.name ?? dbCity.name
  const cityState = fallbackCity?.state ?? ""
  const providerCount = fallbackCity?.providerCount ?? 0

  return {
    title: `Best Daycare in ${cityName}${cityState ? `, ${cityState}` : ""} | Early Learning Directory`,
    description: `Find top-rated daycare centers, preschools, and childcare providers in ${cityName}${
      cityState ? `, ${cityState}` : ""
    }. Compare ${providerCount}+ verified providers.`,
  }
}

const cityFaqs = [
  {
    question: "How much does daycare cost in this area?",
    answer: "Daycare costs vary based on the type of care, age of child, and hours needed. In this area, full-time infant care typically ranges from $1,200-$2,000/month, while preschool programs range from $900-$1,500/month."
  },
  {
    question: "What should I look for when choosing a daycare?",
    answer: "Key factors include: licensing and accreditation, staff qualifications and ratios, curriculum approach, safety measures, cleanliness, location convenience, schedule flexibility, and parent communication practices."
  },
  {
    question: "How do I know if a daycare is licensed?",
    answer: "All licensed childcare providers in this state are listed in the state licensing database. You can verify any provider's license status, inspection history, and any violations through the state childcare licensing website."
  },
  {
    question: "What age can my child start daycare?",
    answer: "Many daycare centers accept infants as young as 6 weeks old. However, availability for infant care is limited due to lower ratios. Some parents prefer to wait until 3-6 months or longer before starting childcare."
  },
  {
    question: "How far in advance should I apply?",
    answer: "We recommend starting your search 3-6 months before you need care. Quality programs often have waitlists, especially for infant and toddler spots. Some families apply even before their baby is born."
  }
]

const nearbySearches = [
  "Infant daycare near me",
  "Affordable preschools",
  "Montessori schools",
  "Part-time childcare",
  "Bilingual daycare",
  "Special needs programs"
]

export default async function LocationPage({ params }: LocationPageProps) {
  const { city: citySlug } = await params
  const dbCity = await getCityBySlug(citySlug)

  const city = cities.find((c) => c.slug === citySlug)

  if (!dbCity && !city) {
    notFound()
  }

  const displayName = city?.name ?? dbCity?.name ?? citySlug
  const state = city?.state
  const stats =
    cityStats[citySlug as keyof typeof cityStats] ??
    {
      averageCost: "N/A",
      totalProviders: 0,
      topRated: 0,
      waitlistAvg: "N/A",
    }
  const cityProviders = providers.filter(
    (p) => p.city.toLowerCase() === displayName.toLowerCase(),
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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
            Find and compare {city?.providerCount ?? 0}+ verified childcare providers in {displayName}. 
            Read real parent reviews, compare programs, and connect with top-rated daycare centers near you.
          </p>
          <SearchBar className="max-w-3xl" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <StatsSection stats={stats} cityName={displayName} />
        </div>
      </section>

      {/* Top Providers */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Top Providers in {displayName}
              </h2>
              <p className="text-muted-foreground">
                Highest-rated childcare centers loved by local families
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href={`/search?location=${citySlug}`}>
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
              <Link href={`/search?location=${citySlug}`}>View all providers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <Card>
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {cityFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Popular Nearby Searches */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Popular Searches in {displayName}
          </h2>
          <div className="flex flex-wrap gap-3">
            {nearbySearches.map((search) => (
              <Link
                key={search}
                href={`/search?location=${citySlug}&q=${encodeURIComponent(search)}`}
                className="px-4 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {search}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other Cities */}
      <section className="py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Browse Other Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {cities.filter((c) => c.slug !== citySlug).map((otherCity) => (
              <Link
                key={otherCity.slug}
                href={`/locations/${otherCity.slug}`}
                className="p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors text-center"
              >
                <p className="font-medium text-foreground">{otherCity.name}</p>
                <p className="text-sm text-muted-foreground">{otherCity.providerCount} providers</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
