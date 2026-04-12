import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { SearchX, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      {/* Soft background accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <SearchX className="h-3.5 w-3.5 text-primary" />
          </span>
          <span className="uppercase tracking-wide">Page not found</span>
        </div>

        <div className="mb-6 flex items-center gap-3 text-muted-foreground">
          <Image
            src="/images/twooky-logo.png"
            alt="Twooky logo"
            width={383}
            height={156}
            sizes="180px"
            className="h-12 w-auto sm:h-14"
          />
          <div className="text-left">
            <p className="text-sm text-muted-foreground">
              The world of opportunities for kids & youngsters
            </p>
          </div>
        </div>

        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mb-8 max-w-xl text-sm text-muted-foreground sm:text-base">
          The page you&apos;re looking for may have moved or no longer exists. Let&apos;s get you
          back to discovering great childcare options near you.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/search">
              <SearchX className="mr-2 h-4 w-4" />
              Search childcare
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Or explore our{" "}
          <Link
            href="/locations/us/austin"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            locations
          </Link>{" "}
          and{" "}
          <Link
            href="/programs"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            programs
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
