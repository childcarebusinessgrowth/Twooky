import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check, Baby } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  getActiveProgramTypes,
  getAgeGroupsById,
  getProgramTypeBySlug,
  programTypeToCardShape,
  iconMap,
  slugToIcon,
} from "@/lib/program-types"

interface ParentProgramDetailPageProps {
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

export default async function ParentProgramDetailPage({
  params,
}: ParentProgramDetailPageProps) {
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

  const [allRows, ageGroupsById] = await Promise.all([
    getActiveProgramTypes(),
    getAgeGroupsById(),
  ])

  const otherPrograms = allRows
    .filter((r) => r.slug && r.slug !== slug)
    .slice(0, 5)
    .map((item) => programTypeToCardShape(item, ageGroupsById))

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card px-6 py-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{row.name} Programs</h1>
            <p className="mt-2 text-sm text-muted-foreground">{row.short_description ?? ""}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>About {row.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
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
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {faqs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Find {row.name} Near You</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Search for {row.name.toLowerCase()} programs in your area.
              </p>
              <Button asChild className="w-full">
                <Link href={`/search?program=${slug}`}>
                  Search Programs
                  <ArrowRight className="ml-2 h-4 w-4" />
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
                          href={`/dashboard/parent/decision-support/programs/${otherProgram.slug}`}
                          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
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
      </section>
    </div>
  )
}
