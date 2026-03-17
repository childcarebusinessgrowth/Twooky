import Link from "next/link"
import {
  Users,
  MessageSquare,
  ImageIcon,
  Star,
  TrendingUp,
  Shield,
  ArrowRight,
  BadgeCheck,
  Clock3,
  Crown,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClaimListingForm } from "./claim-form"

export const metadata = {
  title: "Claim Your Listing | Early Learning Directory",
  description: "Join thousands of childcare providers using Early Learning Directory to connect with local families. Claim your free listing today.",
}

const benefits = [
  {
    icon: Users,
    title: "Get More Parent Inquiries",
    description: "Connect with thousands of parents actively searching for childcare in your area."
  },
  {
    icon: ImageIcon,
    title: "Showcase Your Facility",
    description: "Upload photos and videos to give parents a virtual tour of your center."
  },
  {
    icon: MessageSquare,
    title: "Collect Reviews",
    description: "Build trust with authentic reviews from happy families."
  },
  {
    icon: TrendingUp,
    title: "Track Your Performance",
    description: "See how many parents view and contact your listing with detailed analytics."
  }
]

const benefitCardStyles = [
  {
    colSpan: "lg:col-span-7",
    surface: "bg-linear-to-br from-primary/15 via-background to-primary/5",
    icon: "bg-primary text-primary-foreground",
    tag: "Top visibility impact"
  },
  {
    colSpan: "lg:col-span-5",
    surface: "bg-linear-to-br from-emerald-500/15 via-background to-emerald-500/5",
    icon: "bg-emerald-600 text-white",
    tag: "Trust builder"
  },
  {
    colSpan: "lg:col-span-5",
    surface: "bg-linear-to-br from-blue-500/15 via-background to-blue-500/5",
    icon: "bg-secondary text-secondary-foreground",
    tag: "Brand experience",
    useClaimButtonTone: true
  },
  {
    colSpan: "lg:col-span-7",
    surface: "bg-linear-to-br from-violet-500/15 via-background to-violet-500/5",
    icon: "bg-secondary text-secondary-foreground",
    tag: "Growth analytics",
    useClaimButtonTone: true
  }
]

const stats = [
  { value: "50,000+", label: "Monthly Parent Searches" },
  { value: "10,000+", label: "Verified Providers" },
  { value: "98%", label: "Parent Satisfaction" },
]

const heroTrustSignals = [
  "No credit card required",
  "Free listing setup",
  "Fast provider verification"
]

const rankingFactors = [
  {
    icon: BadgeCheck,
    title: "Verification status",
    description:
      "Verified providers are prioritized because their details have been checked and confirmed.",
    action: "Complete provider verification and keep licensing details current."
  },
  {
    icon: Star,
    title: "Review score & volume",
    description:
      "Higher average ratings and a steady stream of recent reviews generally improve your placement.",
    action: "Request recent parent reviews consistently and respond professionally."
  },
  {
    icon: Clock3,
    title: "Recency of activity & updates",
    description:
      "Keeping your profile up to date and logging in regularly signals that your information is current.",
    action: "Refresh hours, photos, openings, and programs frequently."
  },
  {
    icon: MessageSquare,
    title: "Provider response rate",
    description:
      "Responding quickly and consistently to messages from families can boost your visibility.",
    action: "Reply to new inquiries quickly and maintain a high response consistency."
  },
  {
    icon: Crown,
    title: "Premium/featured subscription boost",
    description:
      "Premium and featured plans add an extra visibility boost on top of your organic ranking factors.",
    action: "Upgrade to premium or featured plans for additional exposure."
  }
]

const steps = [
  {
    step: "1",
    title: "Search for Your Listing",
    description: "Find your existing listing or create a new one in minutes."
  },
  {
    step: "2",
    title: "Verify Ownership",
    description: "Confirm you're the owner through a quick verification process."
  },
  {
    step: "3",
    title: "Complete Your Profile",
    description: "Add photos, programs, and details to attract more families."
  }
]

export default function ClaimListingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-primary/10 via-background to-background" />
        <div className="pointer-events-none absolute -left-20 top-16 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-12 -z-10 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-36 bg-linear-to-t from-background via-background/90 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Shield className="h-3.5 w-3.5" />
                Built for Childcare Providers
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
                Turn profile views into{" "}
                <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                  real enrollment
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Claim your listing in minutes and showcase your programs to families actively searching
                in your area. Improve visibility, earn trust, and grow inquiries from qualified parents.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {heroTrustSignals.map((signal) => (
                  <span
                    key={signal}
                    className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
                  >
                    {signal}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur-sm"
                  >
                    <p className="text-2xl font-extrabold leading-none tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Claim Form */}
            <ClaimListingForm />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 bottom-8 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12 md:mb-14">
            <span className="inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
              Provider advantage
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 text-balance">
              Why Claim Your Listing?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              A claimed listing helps you stand out and connect with more families in your area.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {benefits.map((benefit, index) => {
              const style = benefitCardStyles[index % benefitCardStyles.length]
              return (
                <article
                  key={benefit.title}
                  className={`group relative overflow-hidden rounded-2xl border border-border/80 p-6 md:p-7 transition-all hover:-translate-y-1 hover:shadow-lg ${style.colSpan} ${style.surface}`}
                >
                  <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-white/40 blur-2xl" />
                  <div className="relative flex items-start gap-4">
                    <div
                      className={`h-12 w-12 flex items-center justify-center shrink-0 ${
                        style.useClaimButtonTone ? "rounded-md" : "rounded-xl shadow-sm"
                      } ${style.icon}`}
                    >
                      <benefit.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <span className="inline-flex rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        {style.tag}
                      </span>
                      <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm md:text-[15px] leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Ranking Transparency */}
      <section className="py-16 md:py-20 bg-linear-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <Card className="max-w-6xl mx-auto border-border/70 bg-background/90 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary w-fit mx-auto mb-4">
                Ranking transparency
              </div>
              <CardTitle className="text-center text-2xl md:text-3xl">
                How your ranking is determined
              </CardTitle>
              <p className="text-center text-muted-foreground max-w-3xl mx-auto">
                We rank providers to help families find trusted, active programs first. Your position is
                based on several factors you can influence.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center justify-center gap-2 pb-1">
                <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">Quality</span>
                <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">Engagement</span>
                <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">Freshness</span>
                <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">Visibility boost</span>
              </div>

              <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rankingFactors.map((factor, index) => (
                  <li
                    key={factor.title}
                    className="group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md h-full"
                  >
                    <div className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-primary/5 transition-colors group-hover:bg-primary/10" />
                    <div className="relative mb-4 flex items-center justify-between">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <factor.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="relative font-semibold text-foreground mb-2">{factor.title}</h3>
                    <p className="relative text-sm text-muted-foreground leading-relaxed">{factor.description}</p>
                    <div className="relative mt-4 border-t border-border/70 pt-3">
                      <p className="text-xs font-medium text-foreground mb-1">How to improve</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{factor.action}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="rounded-lg border border-border/70 bg-muted/50 px-4 py-3">
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  No single factor guarantees a specific position. We combine these signals to highlight
                  providers who are trusted, responsive, and up to date.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Claiming your listing is quick and easy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="text-center relative">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-8 w-24 border-t-2 border-dashed border-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 text-center">
          <div className="flex justify-center mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl text-foreground font-medium mb-6 text-pretty">
            &quot;Since claiming our listing on Early Learning Directory, we&apos;ve seen a 40% increase in parent 
            inquiries. The platform makes it easy to showcase what makes our center special.&quot;
          </blockquote>
          <cite className="text-muted-foreground not-italic">
            — Maria S., Director at Sunshine Learning Center
          </cite>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-primary">
        <div className="mx-auto max-w-3xl px-4 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Ready to Grow Your Enrollment?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Join thousands of providers who trust Early Learning Directory to connect with families.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/claim-listing">
              Claim Your Free Listing
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
