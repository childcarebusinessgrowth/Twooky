import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Parents Area | Twooky",
  description:
    "Discover how Twooky helps parents find trusted providers, compare options quickly, and choose with confidence.",
}

const benefits = [
  {
    title: "Trusted local options",
    description:
      "Browse programs in your area with organized profiles that make it easier to spot the right fit for your child.",
    accent: "primary",
  },
  {
    title: "Save time in your search",
    description:
      "Use one place to explore nurseries, preschools, after-school options, and more instead of checking multiple websites.",
    accent: "secondary",
  },
  {
    title: "Compare with confidence",
    description:
      "Review key details side by side so you can shortlist providers that match your family's schedule and priorities.",
    accent: "tertiary",
  },
  {
    title: "Simple, parent-friendly journey",
    description:
      "From first search to final decision, Twooky keeps the process clear so parents can focus on what matters most.",
    accent: "primary",
  },
]

function accentClasses(accent: string): string {
  if (accent === "secondary") return "from-secondary/90 to-secondary/50"
  if (accent === "tertiary") return "from-tertiary/90 to-tertiary/50"
  return "from-primary/90 to-primary/50"
}

export default function ParentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative isolate overflow-hidden py-14 md:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-primary/8 via-background to-background" />
        <div className="pointer-events-none absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-20 -z-10 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-52 w-[min(100%,54rem)] -translate-x-1/2 rounded-full bg-tertiary/18 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-card/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
              Parents area
            </div>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Why parents choose Twooky
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              Twooky helps families discover quality early learning options faster, compare what matters, and make
              confident choices for their children.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 min-w-44 px-7 text-base font-semibold shadow-md shadow-primary/20" asChild>
                <Link href="/provider/locations">Find provider</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 min-w-44 border-tertiary/30 text-base font-semibold text-tertiary hover:bg-tertiary/10 hover:text-tertiary"
                asChild
              >
                <Link href="/signup?role=parent">Create account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-12 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="group relative overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-[0_2px_24px_-8px_rgba(32,62,104,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_14px_38px_-16px_rgba(32,62,104,0.24)]"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-linear-to-r ${accentClasses(benefit.accent)}`} />
                <CardHeader className="pb-2 pt-7">
                  <CardTitle className="text-xl font-bold tracking-tight">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-7 text-[15px] leading-relaxed text-muted-foreground">
                  {benefit.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-linear-to-r from-primary/4 via-secondary/6 to-tertiary/5 py-12 md:py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 text-center md:grid-cols-3 md:text-left lg:px-8">
          <div>
            <p className="text-2xl font-bold text-primary">One place</p>
            <p className="mt-1 text-sm text-muted-foreground">Search providers and early learning options together.</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-secondary">Clear details</p>
            <p className="mt-1 text-sm text-muted-foreground">See the information families need before reaching out.</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-tertiary">Better decisions</p>
            <p className="mt-1 text-sm text-muted-foreground">Shortlist confidently with a smoother comparison process.</p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Start your Provider search with confidence</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Join families already using Twooky to discover trusted providers and plan their next step with clarity.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 min-w-44 bg-secondary text-secondary-foreground shadow-md shadow-secondary/30 hover:bg-secondary/90"
              asChild
            >
              <Link href="/provider/locations">Explore providers</Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-12 min-w-44 font-semibold" asChild>
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
