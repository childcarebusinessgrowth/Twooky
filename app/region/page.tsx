import type { Metadata } from "next"
import Link from "next/link"
import { RegionMarketPicker } from "@/app/region/region-market-picker"
import { getMarketFromCookies } from "@/lib/market-server"

export const metadata: Metadata = {
  title: "Choose your region | Twooky",
  description:
    "Select United Kingdom, United States, or United Arab Emirates to see local terminology, providers, and cities on Twooky.",
}

export default async function RegionPage() {
  const market = await getMarketFromCookies()

  return (
    <div className="min-h-screen bg-linear-to-b from-primary/5 to-background">
      <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8 lg:py-24">
        <p className="text-sm font-medium text-primary">Region & language</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Where are you searching?
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Twooky adapts labels, trust signals, and featured listings for the UK, US, and UAE. English
          today—with room to add more languages later. Choose the region that matches how you search
          for childcare and kids&apos; programmes.
        </p>

        <div className="mt-10">
          <RegionMarketPicker current={market} />
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </section>
    </div>
  )
}
