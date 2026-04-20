import Image from "next/image"
import Link from "next/link"
import type { ComponentType, SVGProps } from "react"
import {
  Compass,
  MessageCircleMore,
  Percent,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundPlus,
  Users,
  UsersRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRecentPublishedBlogs } from "@/lib/blogs"
import { createSupabaseServerClient } from "@/lib/supabaseServer"

export const metadata = {
  title: "Parents Area | Twooky",
  description:
    "Find trusted nurseries, classes, and tutors. Unlock real member offers and practical advice from parents who have been there.",
}

const heroImageSrc =
  "https://images.pexels.com/photos/3933241/pexels-photo-3933241.jpeg?auto=compress&cs=tinysrgb&w=1800"

type AccentColor = "primary" | "secondary" | "tertiary"
type HeroHighlight = {
  label: string
  value: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  accent: AccentColor
}

const parentBenefits = [
  {
    title: "One place for everything",
    body: "Nurseries, preschools, swimming lessons, tutoring, and holiday camps - all in one place, so you're not juggling five tabs at 10pm.",
    icon: Search,
    accent: "primary" as AccentColor,
  },
  {
    title: "Real savings on real things",
    body: "Unlock discounts and offers from local and national providers, from first swim classes to summer camp bookings.",
    icon: Percent,
    accent: "secondary" as AccentColor,
  },
  {
    title: "A community behind you",
    body: "Honest parent reviews and practical advice when you need it, from families who understand what this season can feel like.",
    icon: MessageCircleMore,
    accent: "tertiary" as AccentColor,
  },
]

const howItWorks = [
  {
    step: "1",
    title: "Create your free account",
    body: "Name, email, password - that is it. No credit card and no catch.",
    icon: UserRoundPlus,
    accent: "primary" as AccentColor,
  },
  {
    step: "2",
    title: "Tell us about your family",
    body: "Share your children's ages, your area, and what you need so recommendations are relevant from day one.",
    icon: UsersRound,
    accent: "secondary" as AccentColor,
  },
  {
    step: "3",
    title: "Start exploring",
    body: "Discover local providers, unlock offers, and move forward with more confidence.",
    icon: Compass,
    accent: "tertiary" as AccentColor,
  },
]

const testimonials = [
  {
    quote:
      "Finally, somewhere I can find everything without googling for hours. Found our new nursery and saved 10% on swimming lessons in the same week.",
    name: "Sarah",
    details: "Mum of two, Manchester · children 2 and 5",
  },
  {
    quote:
      "I thought it would be just another directory. It is not. Reviews from local parents were what sold it for me.",
    name: "James",
    details: "Dad of one, London · child age 3",
  },
  {
    quote:
      "The discount on holiday camp made the decision really easy. We will definitely be using Twooky again.",
    name: "Amina",
    details: "Mum of three, Dubai · children 4, 7, and 9",
  },
]

const heroHighlights: HeroHighlight[] = [
  { label: "Families on Twooky", value: "1,200+", icon: Users, accent: "primary" },
  { label: "Parent reviews", value: "2000+", icon: Star, accent: "secondary" },
  { label: "Free to join", value: "Always", icon: ShieldCheck, accent: "tertiary" },
]

function accentClasses(color: AccentColor): string {
  if (color === "secondary") return "bg-secondary/10 text-secondary border-secondary/25"
  if (color === "tertiary") return "bg-tertiary/10 text-tertiary border-tertiary/25"
  return "bg-primary/10 text-primary border-primary/25"
}

function accentGradient(color: AccentColor): string {
  if (color === "secondary") return "from-secondary/25 via-secondary/10 to-transparent"
  if (color === "tertiary") return "from-tertiary/25 via-tertiary/10 to-transparent"
  return "from-primary/25 via-primary/10 to-transparent"
}

type SponsorDiscountRow = {
  id: string
  title: string
  offer_badge: string | null
  category: string | null
}

export default async function ParentsPage() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("sponsor_discounts")
    .select("id, title, offer_badge, category")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8)

  const activeOffers = (data ?? []) as SponsorDiscountRow[]
  const featuredBlogs = await getRecentPublishedBlogs(3)

  return (
    <div className="min-h-screen bg-background">
      <section className="relative isolate overflow-hidden py-14 md:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-primary/12 via-background to-background" />
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_22%_20%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_84%_24%,color-mix(in_oklab,var(--secondary)_22%,transparent),transparent_44%)]" />
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_52%_88%,color-mix(in_oklab,var(--tertiary)_20%,transparent),transparent_48%)]" />
        <div className="pointer-events-none absolute -left-24 top-12 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-20 -z-10 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-56 w-[min(78%,52rem)] -translate-x-1/2 rounded-full bg-tertiary/18 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              For parents
            </span>
            <h1 className="mt-5 max-w-2xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-[3.4rem] lg:leading-[1.06]">
              Everything your family needs, all in one place
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              Find trusted nurseries, classes and tutors near you. Save on the things your kids love. Get advice from
              parents who have been there. All free to join.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 min-w-48 rounded-full px-7 text-base font-semibold shadow-md shadow-primary/25" asChild>
                <Link href="/signup?role=parent">Create free account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 min-w-48 rounded-full border-secondary/30 bg-card/75 text-base font-semibold text-secondary hover:bg-secondary/8"
                asChild
              >
                <Link href="/search">Browse providers</Link>
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {heroHighlights.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border bg-card/75 p-3 backdrop-blur-sm ${accentClasses(item.accent)}`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <item.icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </div>
                  <p className="mt-1 text-lg font-bold tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-muted-foreground">No credit card needed · GDPR compliant</p>
          </div>
          <div className="relative isolate overflow-hidden rounded-4xl border border-border/70 shadow-xl shadow-primary/10">
            <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/25 via-black/5 to-transparent" />
            <div className="pointer-events-none absolute -left-12 -top-12 z-10 h-36 w-36 rounded-full bg-primary/18 blur-2xl" />
            <div className="pointer-events-none absolute -right-10 bottom-4 z-10 h-36 w-36 rounded-full bg-tertiary/18 blur-2xl" />
            <Image
              src={heroImageSrc}
              alt="Parent smiling with child outdoors"
              width={960}
              height={1120}
              className="h-full min-h-[420px] w-full object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 42vw"
              priority
            />
            <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-white/30 bg-black/40 px-4 py-3 text-white backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Trusted by parents</p>
              <p className="mt-1 text-sm text-white/90">Find providers, savings, and practical advice in one calm flow.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-12 md:pb-24 md:pt-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Built around what parents actually need</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
            {parentBenefits.map((item) => (
              <Card
                key={item.title}
                className="group rounded-3xl border-border/70 bg-card/95 shadow-[0_8px_30px_-15px_rgba(32,62,104,0.22)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
              >
                <div className={`h-1.5 bg-linear-to-r ${accentGradient(item.accent)}`} />
                <CardHeader className="pb-2 pt-7">
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${accentClasses(item.accent)}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-7 text-[15px] leading-relaxed text-muted-foreground">{item.body}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl rounded-3xl border border-border/60 bg-linear-to-br from-primary/5 via-background to-secondary/5 px-4 py-10 lg:px-8 lg:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Member perks</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Real savings from the places your family already loves
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Every Twooky account includes access to exclusive offers from local and national providers - swim
              schools, nurseries, classes, camps, and more.
            </p>
            <p className="mt-4 text-sm font-medium text-foreground">A few of the offers members are using right now</p>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeOffers.map((offer, index) => (
              <div key={offer.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground line-clamp-2">{offer.title}</p>
                <p
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accentClasses(
                    index % 3 === 0 ? "primary" : index % 3 === 1 ? "secondary" : "tertiary"
                  )}`}
                >
                  {offer.offer_badge?.trim() || offer.category?.trim() || "Member offer"}
                </p>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-tertiary/35 bg-tertiary/5 p-4">
              <p className="text-sm font-semibold text-foreground">+ new offers added every month</p>
              <p className="mt-2 text-xs text-muted-foreground">Sign up to unlock all active offers for your area.</p>
            </div>
          </div>

          <div className="mt-7">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/signup?role=parent">Unlock member offers</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Parent library</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Practical advice for the moments that matter
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Short, honest reads from our team and other parents - for when you need a steer, reassurance, or a
              second opinion.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {featuredBlogs.length > 0 ? (
              featuredBlogs.map((post, index) => (
                <Link key={post.slug} href={`/blogs/${post.slug}`} className="group">
                  <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/95 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`rounded-full px-2.5 py-1 font-semibold ${accentClasses(
                            index % 3 === 0 ? "primary" : index % 3 === 1 ? "secondary" : "tertiary"
                          )}`}
                        >
                          {post.tags[0] ?? "Parent guide"}
                        </span>
                        <span className="text-muted-foreground">{post.readingTime}</span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="rounded-3xl border-dashed md:col-span-3">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-medium text-foreground">No published blog posts yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This section automatically shows the latest admin-published articles.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="mt-7">
            <Button asChild variant="outline" size="lg" className="rounded-full border-primary/25 px-7">
              <Link href="/blogs">Read more on the blog</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-linear-to-r from-primary/5 via-background to-secondary/5 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Getting started takes about a minute</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {howItWorks.map((item) => (
              <Card key={item.step} className="rounded-3xl border-border/60 bg-card/90">
                <CardHeader className="pb-2">
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-primary-foreground ${
                        item.accent === "secondary"
                          ? "bg-secondary"
                          : item.accent === "tertiary"
                            ? "bg-tertiary"
                            : "bg-primary"
                      }`}
                    >
                      {item.step}
                    </span>
                    <item.icon
                      className={`h-5 w-5 ${item.accent === "secondary" ? "text-secondary" : item.accent === "tertiary" ? "text-tertiary" : "text-primary"}`}
                    />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-[15px] text-muted-foreground">{item.body}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">From parents, in their own words</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <Card key={item.name} className="rounded-3xl border-border/60 bg-card/95">
                <div
                  className={`h-1.5 bg-linear-to-r ${
                    index === 0
                      ? "from-primary/25 via-primary/10 to-transparent"
                      : index === 1
                        ? "from-secondary/25 via-secondary/10 to-transparent"
                        : "from-tertiary/25 via-tertiary/10 to-transparent"
                  }`}
                />
                <CardContent className="p-6">
                  <p className="text-base leading-relaxed text-foreground">"{item.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                        index === 0
                          ? "bg-primary/10 text-primary"
                          : index === 1
                            ? "bg-secondary/10 text-secondary"
                            : "bg-tertiary/10 text-tertiary"
                      }`}
                    >
                      {item.name[0]}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.details}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 pt-14 md:pb-32 md:pt-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-3xl bg-linear-to-r from-primary/10 via-secondary/10 to-tertiary/10 p-8 text-center shadow-sm md:p-12">
            <h2 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Join thousands of parents making better choices for their families
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              It takes about a minute to sign up. It is free. You can cancel any time.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-12 min-w-48 px-7 text-base font-semibold" asChild>
                <Link href="/signup?role=parent">Create free account</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 min-w-48 border-tertiary/25 text-base font-semibold text-tertiary" asChild>
                <Link href="/search">Browse providers first</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Free to join forever · No credit card needed · Your data is safe with us (GDPR compliant)
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
