import Link from "next/link"
import { Baby } from "lucide-react"

const footerLinks = {
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blogs" },
    { name: "Contact", href: "/contact" },
    { name: "Browse Locations", href: "/childcare/locations" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Provider Sign Up", href: "/claim-listing" },
  ],
  cities: [
    { name: "Austin", href: "/locations/austin" },
    { name: "Phoenix", href: "/locations/phoenix" },
    { name: "Miami", href: "/locations/miami" },
    { name: "Dallas", href: "/locations/dallas" },
    { name: "San Diego", href: "/locations/san-diego" },
  ],
  searches: [
    { name: "Daycare Near Me", href: "/search" },
    { name: "Preschools", href: "/programs/preschool" },
    { name: "Montessori Programs", href: "/programs/montessori" },
    { name: "Infant Care", href: "/programs/infant-care" },
    { name: "After School Programs", href: "/programs/after-school" },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Baby className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                Twooky
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Helping parents find the best childcare for their families.
            </p>
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
              {footerLinks.cities.map((link) => (
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

          {/* Popular Searches */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Popular Searches
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.searches.map((link) => (
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
