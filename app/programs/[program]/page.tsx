import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import { Baby } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ProviderCard } from "@/components/provider-card"
import { getFeaturedProvidersForProgram } from "@/lib/search-providers-db"
import {
  getActiveProgramTypes,
  getAgeGroupsById,
  getProgramTypeBySlug,
  programTypeToCardShape,
  iconMap,
  slugToIcon,
} from "@/lib/program-types"
import { buildFaqPageSchema, stringifyJsonLd } from "@/lib/schema"

export const revalidate = 120

interface ProgramPageProps {
  params: Promise<{ program: string }>
}

export async function generateStaticParams() {
  const rows = await getActiveProgramTypes()
  return rows
    .filter((r) => r.slug)
    .map((row) => ({
      program: row.slug!,
    }))
}

export async function generateMetadata({ params }: ProgramPageProps) {
  const { program: programSlug } = await params
  const row = await getProgramTypeBySlug(programSlug)

  if (!row) {
    return { title: "Program Not Found" }
  }

  const description = row.about_text?.slice(0, 160) ?? row.short_description ?? ""
  return {
    title: `${row.name} Programs | Twooky`,
    description,
  }
}

export default async function ProgramDetailPage({ params }: ProgramPageProps) {
  const { program: programSlug } = await params
  const row = await getProgramTypeBySlug(programSlug, { includeFaqs: true })

  if (!row) {
    notFound()
  }

  const slug = row.slug ?? programSlug
  const iconName = slugToIcon(slug)
  const Icon = iconMap[iconName] ?? Baby
  const benefits = row.key_benefits ?? []
  const faqs = (row.faqs ?? []).map((f) => ({ question: f.question, answer: f.answer }))
  const faqSchema = buildFaqPageSchema(faqs)
  const faqJsonLd = faqSchema ? stringifyJsonLd(faqSchema) : null

  // Other program types for sidebar
  const [allRows, ageGroupsById] = await Promise.all([
    getActiveProgramTypes(),
    getAgeGroupsById(),
  ])
  const otherPrograms = allRows
    .filter((r) => r.slug && r.slug !== slug)
    .slice(0, 5)
    .map((row) => programTypeToCardShape(row, ageGroupsById))

  const featuredProviders = await getFeaturedProvidersForProgram(slug, 3, null)

  return (
    <div className="min-h-screen bg-background">
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqJsonLd }}
        />
      ) : null}
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {row.name} Programs
              </h1>
              <p className="text-muted-foreground">
                {row.short_description ?? ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Description */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>About {row.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {row.about_text ?? row.short_description ?? ""}
                  </p>
                </CardContent>
              </Card>

              {benefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Key Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-muted-foreground">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* FAQs */}
              {faqs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq, index) => (
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
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Find {row.name} Near You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search for {row.name.toLowerCase()} programs in your area.
                  </p>
                  <Button asChild className="w-full bg-primary hover:bg-primary/90">
                    <Link href={`/search?program=${slug}`}>
                      Search Programs
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {otherPrograms.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Other Program Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {otherPrograms.map((otherProgram) => {
                        const OtherIcon = iconMap[otherProgram.icon] ?? Baby
                        return (
                          <li key={otherProgram.slug}>
                            <Link
                              href={`/programs/${otherProgram.slug}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <OtherIcon className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground hover:text-foreground">
                                {otherProgram.title}
                              </span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Featured {row.name} Providers
              </h2>
              <p className="text-muted-foreground">
                Top-rated providers offering {row.name.toLowerCase()} programs
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href={`/search?program=${slug}`}>
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                featured={provider.featured}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
