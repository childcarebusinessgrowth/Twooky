import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ProviderCard } from "@/components/provider-card"
import { 
  Baby, 
  Footprints, 
  GraduationCap, 
  Blocks, 
  Home, 
  Backpack,
  Heart
} from "lucide-react"
import { programs, providers, getProgramBySlug } from "@/lib/mock-data"

interface ProgramPageProps {
  params: Promise<{ program: string }>
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Baby,
  Footprints,
  GraduationCap,
  Blocks,
  Home,
  Backpack,
  Heart
}

export async function generateStaticParams() {
  return programs.map((program) => ({
    program: program.slug,
  }))
}

export async function generateMetadata({ params }: ProgramPageProps) {
  const { program: programSlug } = await params
  const program = getProgramBySlug(programSlug)
  
  if (!program) {
    return { title: "Program Not Found" }
  }

  return {
    title: `${program.title} Programs | Early Learning Directory`,
    description: program.fullDescription.slice(0, 160),
  }
}

const programFaqs = [
  {
    question: "What age is appropriate for this program?",
    answer: "Age requirements vary by program. Infant care typically accepts children from 6 weeks to 12 months, toddler programs serve ages 1-2, preschool is for ages 3-5, and school-age programs are for children 5 and older."
  },
  {
    question: "How do I know if this program is right for my child?",
    answer: "Consider your child's temperament, developmental needs, and your family's values. We recommend visiting multiple programs, observing classrooms, and speaking with current parents before making a decision."
  },
  {
    question: "What qualifications do teachers have?",
    answer: "Teacher qualifications vary by program type and state requirements. Most states require lead teachers to have at least a Child Development Associate (CDA) credential, while many have degrees in early childhood education."
  },
  {
    question: "How can I prepare my child for starting this program?",
    answer: "Gradual transitions work best. Visit the program together, establish consistent routines at home, read books about school, and maintain a positive attitude about the experience."
  }
]

export default async function ProgramDetailPage({ params }: ProgramPageProps) {
  const { program: programSlug } = await params
  const program = getProgramBySlug(programSlug)
  
  if (!program) {
    notFound()
  }

  const Icon = iconMap[program.icon] || Baby
  
  // Get providers that offer this program type
  const programTitle = program.title.toLowerCase()
  const relevantProviders = providers.filter(p => 
    p.programTypes.some(type => type.toLowerCase().includes(programTitle.split(' ')[0]))
  ).slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {program.title} Programs
              </h1>
              <p className="text-muted-foreground">{program.shortDescription}</p>
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
                  <CardTitle>About {program.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {program.fullDescription}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {program.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* FAQs */}
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {programFaqs.map((faq, index) => (
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

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Find {program.title} Near You</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search for {program.title.toLowerCase()} programs in your area.
                  </p>
                  <Button asChild className="w-full bg-primary hover:bg-primary/90">
                    <Link href={`/search?program=${program.slug}`}>
                      Search Programs
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Other Program Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {programs.filter(p => p.slug !== program.slug).slice(0, 5).map((otherProgram) => {
                      const OtherIcon = iconMap[otherProgram.icon] || Baby
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
                Featured {program.title} Providers
              </h2>
              <p className="text-muted-foreground">
                Top-rated providers offering {program.title.toLowerCase()} programs
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href={`/search?program=${program.slug}`}>
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(relevantProviders.length > 0 ? relevantProviders : providers.slice(0, 3)).map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
