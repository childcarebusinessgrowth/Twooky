import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "For Providers | Twooky",
  description:
    "List your early learning program on Twooky: claim an existing listing or create a new one and reach local families.",
}

/** Renders in the OS emoji font (e.g. Apple Color Emoji) , same family as 👋 on the dashboard */
function EmojiIcon({
  emoji,
  label,
  className,
}: {
  emoji: string
  label: string
  className?: string
}) {
  return (
    <span className={`font-emoji ${className ?? ""}`} role="img" aria-label={label}>
      {emoji}
    </span>
  )
}

export default function ForProvidersPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative isolate overflow-hidden py-14 md:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-primary/[0.07] via-background to-background" />
        <div className="pointer-events-none absolute -left-24 top-10 -z-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-0 -z-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-48 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-tertiary/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-card/80 py-2 pl-3 pr-4 shadow-sm backdrop-blur-sm">
              <EmojiIcon emoji="✨" label="Sparkles" className="text-xl leading-none" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                List Your Business on Twooky
              </span>
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Already on Twooky, or brand new?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              If families can already find your program here, claim your listing. If you&apos;re not on the directory
              yet, create a new listing, it only takes a few minutes to get started.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:gap-8">
            <Card className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/95 shadow-[0_2px_24px_-8px_rgba(32,62,104,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_40px_-12px_rgba(32,62,104,0.2)]">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-primary/80 via-primary to-primary/80" />
              <CardHeader className="space-y-4 pb-2 pt-8">
                <EmojiIcon emoji="🛡️" label="Shield" className="block text-5xl leading-none md:text-[3.25rem]" />
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight md:text-2xl">
                    We already list your business
                  </CardTitle>
                  <CardDescription className="mt-2 text-base leading-relaxed text-muted-foreground">
                    Claim your free profile to manage photos, hours, and inquiries.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pb-8">
                <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                  <li className="flex gap-3">
                    <span className="font-emoji mt-0.5 shrink-0 text-base leading-none" aria-hidden>
                      ✅
                    </span>
                    Match your business to the existing directory record
                  </li>
                  <li className="flex gap-3">
                    <span className="font-emoji mt-0.5 shrink-0 text-base leading-none" aria-hidden>
                      ✅
                    </span>
                    Verify ownership, then unlock your dashboard
                  </li>
                </ul>
                <Button className="h-12 w-full text-base font-semibold shadow-md shadow-primary/20" size="lg" asChild>
                  <Link href="/claim-listing">Claim an existing listing</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-2xl border-border/60 bg-card/95 shadow-[0_2px_24px_-8px_rgba(249,187,17,0.15)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary/35 hover:shadow-[0_12px_40px_-12px_rgba(249,187,17,0.22)]">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-secondary/90 via-secondary to-amber-400/90" />
              <CardHeader className="space-y-4 pb-2 pt-8">
                <EmojiIcon emoji="🏢" label="Building" className="block text-5xl leading-none md:text-[3.25rem]" />
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight md:text-2xl">
                    You&apos;re not on Twooky yet
                  </CardTitle>
                  <CardDescription className="mt-2 text-base leading-relaxed text-muted-foreground">
                    Sign up as a provider and build your listing from your dashboard.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pb-8">
                <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                  <li className="flex gap-3">
                    <span className="font-emoji mt-0.5 shrink-0 text-base leading-none" aria-hidden>
                      ✅
                    </span>
                    Create your account and add your program details
                  </li>
                  <li className="flex gap-3">
                    <span className="font-emoji mt-0.5 shrink-0 text-base leading-none" aria-hidden>
                      ✅
                    </span>
                    Publish when you&apos;re ready, no claim step needed
                  </li>
                </ul>
                <Button
                  className="h-12 w-full bg-secondary text-secondary-foreground text-base font-semibold shadow-md shadow-secondary/25 hover:bg-secondary/90"
                  size="lg"
                  asChild
                >
                  <Link href="/signup?role=provider">Add a new listing</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
            . Not sure which path fits?{" "}
            <Link href="/contact" className="font-semibold text-primary underline-offset-4 hover:underline">
              Contact us
            </Link>
            , we&apos;re happy to help.
          </p>
        </div>
      </section>

      <section className="border-t border-border py-14 md:py-16">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-4 text-center">
          <EmojiIcon emoji="👋" label="Waving hand" className="text-5xl leading-none md:text-[3.25rem]" />
          <p className="text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Returning providers can go straight to the dashboard after signing in.
          </p>
          <Button variant="outline" size="lg" className="min-w-40 font-semibold" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
