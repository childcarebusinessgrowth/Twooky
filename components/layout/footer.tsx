import Link from "next/link"
import Image from "next/image"
import type { FooterCityLink } from "@/lib/locations"
import type { MarketId } from "@/lib/market"
import { getMarketCopy } from "@/lib/market-copy"

const footerLinks = {
  company: [
    { name: "About", href: "/about" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blogs" },
    { name: "Contact", href: "/contact" },
    { name: "Browse Locations", href: "/childcare/locations" },
    { name: "Region & language", href: "/region" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "For providers", href: "/for-providers" },
  ],
}

type FooterProps = {
  cities: FooterCityLink[]
  market: MarketId
}

export function Footer({ cities, market }: FooterProps) {
  const copy = getMarketCopy(market)
  const currentYear = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <Image
                src="/images/twooky-logo.png"
                alt="Twooky logo"
                width={383}
                height={156}
                sizes="220px"
                className="h-15 w-auto sm:h-16"
              />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{copy.footerTagline}</p>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Company
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Cities */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Popular Cities
            </h3>
            <ul className="mt-4 space-y-3">
              {cities.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Searches */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Popular Searches
            </h3>
            <ul className="mt-4 space-y-3">
              {copy.footerPopularSearches.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 border-t border-border pt-8 pb-2 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} Twooky. All rights reserved. This platform is GDPR compliant.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
