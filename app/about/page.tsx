import Link from "next/link"
import Image from "next/image"
import { Target, Users, Building2, ShieldCheck, Star, Users as UsersIcon, Award, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = {
  title: "About | Twooky",
  description: "Learn more about the mission behind Twooky.",
}

const missionFeatures = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "Our mission is to help parents quickly understand their options, compare trusted providers, and feel confident in the provider decisions they make for their family.",
  },
  {
    icon: Users,
    title: "For Families",
    description:
      "We combine detailed provider profiles, transparent reviews, and clear program information to give you a complete picture of each option,all in one place.",
  },
  {
    icon: Building2,
    title: "For Providers",
    description:
      "For providers, we offer tools to showcase their programs, respond to inquiries, and build trust with families through verified reviews and up-to-date information.",
  },
]

const impactStats = [
  { icon: UsersIcon, value: "500+", label: "Verified Providers" },
  { icon: Star, value: "2,000+", label: "Parent Reviews" },
  { icon: ShieldCheck, value: "5,000+", label: "Families Served" },
  { icon: Award, value: "95%", label: "Satisfaction Rate" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
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
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-secondary/14 via-primary/7 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_24%_28%,rgba(255,255,255,0.16),transparent_50%)]" />

        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-16 md:py-20 lg:py-24">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-3 py-1.5 text-xs md:text-sm font-medium text-white/90 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4" />
              Trusted by families nationwide
            </div>

            <h1 className="max-w-3xl text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.03] text-white tracking-tight mb-4 text-balance">
              About Twooky
            </h1>

            <p className="max-w-2xl text-base md:text-xl text-white/90 leading-relaxed text-pretty">
              We built Twooky to make finding quality providers simpler, clearer,
              and less stressful for families.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values Cards */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <span className="mb-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary/80">
              Our Story
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
              Mission & Values
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              We&apos;re here to connect families with trusted provider options and help providers
              reach the families who need them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {missionFeatures.map((feature) => (
              <Card
                key={feature.title}
                className="group rounded-3xl border-border/60 bg-linear-to-b from-card to-card/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30"
              >
                <CardContent className="p-6 md:p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Impact Section */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-muted/25 to-background" />
        <div className="pointer-events-none absolute inset-x-0 top-8 -z-10 mx-auto h-48 w-[min(90%,72rem)] rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 md:p-8 lg:p-10 shadow-sm backdrop-blur-sm">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-2">
                Our Impact
              </h2>
              <p className="mx-auto max-w-xl text-muted-foreground">
                Numbers that reflect our commitment to connecting families with quality providers.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {impactStats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-border/60 bg-background/80 p-4 md:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs md:text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Story / Content Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-6">
              Why We Built This
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Finding the right provider is one of the most important decisions a family can make.
                Yet for too long, parents have had to juggle multiple websites, scattered reviews, and
                incomplete information,all while balancing work, life, and the needs of their children.
              </p>
              <p>
                Twooky was created to change that. We bring together detailed provider
                profiles, verified reviews, clear program information, and easy comparison tools,all in
                one place. Our goal is simple: help you find the best fit for your family with less
                stress and more confidence.
              </p>
              <p>
                Whether you&apos;re looking for infant care, preschool, after-school programs, or something
                else entirely, we&apos;re here to support you every step of the way.
              </p>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/search">
                  Find Provider Near You
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="rounded-full">
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
