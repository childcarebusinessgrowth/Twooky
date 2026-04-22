import Link from "next/link"
import { Baby, GraduationCap, Palmtree, Trophy, Sparkles } from "lucide-react"
import type { MarketId } from "@/lib/market"
import { getMarketCopy } from "@/lib/market-copy"
import { getProviderTypeMenuGroups } from "@/lib/provider-taxonomy"

type HomeHeroCategoriesProps = {
  market: MarketId
}

function getIconForCategory(label: string) {
  const normalized = label.trim().toLowerCase()
  if (normalized.includes("provider")) return Baby
  if (normalized.includes("class")) return Trophy
  if (normalized.includes("tutor")) return GraduationCap
  if (normalized.includes("camp")) return Palmtree
  return Sparkles
}

export async function HomeHeroCategories({ market }: HomeHeroCategoriesProps) {
  const copy = getMarketCopy(market)
  const items = await getProviderTypeMenuGroups()

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
          <h2 id="hero-categories-heading" className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Browse by category
          </h2>
          <p className="mt-2 text-muted-foreground">
            Explore the live provider taxonomy from the directory instead of a static category list.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((group) => {
            const Icon = getIconForCategory(group.label)
            const firstLink = group.links[0]
            const preview = group.links.slice(0, 3).map((link) => link.name).join(", ")
            const extraCount = group.links.length - Math.min(group.links.length, 3)
            return (
              <Link
                key={group.label}
                href={firstLink?.href ?? "/search"}
                className="group rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
              >
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary">{group.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {preview}
                  {extraCount > 0 ? ` and ${extraCount} more.` : "."}
                  {group.label.toLowerCase().includes("provider")
                    ? ` Find ${copy.mainCareTerm} and related options.`
                    : ""}
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Explore →
                </span>
              </Link>
            )
          })}
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
