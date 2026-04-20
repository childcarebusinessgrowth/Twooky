import Link from "next/link"
import { Baby, GraduationCap, Palmtree, Trophy } from "lucide-react"
import type { MarketId } from "@/lib/market"
import { getMarketCopy } from "@/lib/market-copy"

type HomeHeroCategoriesProps = {
  market: MarketId
}

export function HomeHeroCategories({ market }: HomeHeroCategoriesProps) {
  const copy = getMarketCopy(market)

  const items = [
    {
      title: "Childcare",
      description: `Nurseries, preschools, after-school and wraparound care—find ${copy.mainCareTerm} that fit your schedule.`,
      href: "/programs",
      Icon: Baby,
    },
    {
      title: "Classes & activities",
      description: "Swimming, music, sports, baby classes, and toddler groups near you.",
      href: "/sports-academies",
      Icon: Trophy,
    },
    {
      title: "Tutoring & education",
      description: "In-person or online tutoring, exam prep, and homework support.",
      href: "/tutoring",
      Icon: GraduationCap,
    },
    {
      title: "Camps & holiday programmes",
      description: "Holiday camps, summer camps, and activity weeks—book ahead with confidence.",
      href: "/holiday-camps",
      Icon: Palmtree,
    },
  ]

  return (
    <section
      className="relative border-y border-border/60 bg-linear-to-b from-muted/40 to-background py-16 md:py-20"
      aria-labelledby="hero-categories-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wide text-primary/80">
            Start here
          </span>
          <h2
            id="hero-categories-heading"
            className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
          >
            Four ways to find what you need
          </h2>
          <p className="mt-2 text-muted-foreground">
            Twooky covers childcare, activities, tutoring, and camps—so you see the full picture, not just one category.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ title, description, href, Icon }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Explore →
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Looking for therapy or SEN support?{" "}
          <Link href="/therapy-services" className="font-medium text-primary underline-offset-4 hover:underline">
            Therapy & support services
          </Link>{" "}
          stay in the main menu—always easy to find.
        </p>
      </div>
    </section>
  )
}
