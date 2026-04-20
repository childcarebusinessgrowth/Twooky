"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketId } from "@/lib/market"
import type { MarketOption } from "@/lib/market-options"
import { MarketSelector } from "@/components/market-selector"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Pricing", href: "/pricing" },
  { name: "Programs", href: "/programs" },
  { name: "Locations", href: "/childcare/locations" },
]

const exploreGroups: Array<{
  label: string
  links: Array<{ name: string; href: string }>
}> = [
  {
    label: "Childcare",
    links: [
      { name: "Nurseries", href: "/nurseries" },
      { name: "Preschools", href: "/preschools" },
      { name: "After-school programs", href: "/afterschool-programs" },
    ],
  },
  {
    label: "Classes & activities",
    links: [{ name: "Sports & activities", href: "/sports-academies" }],
  },
  {
    label: "Tutoring & education",
    links: [{ name: "Tutoring", href: "/tutoring" }],
  },
  {
    label: "Camps",
    links: [{ name: "Holiday camps", href: "/holiday-camps" }],
  },
  {
    label: "Support",
    links: [{ name: "Therapy & support services", href: "/therapy-services" }],
  },
]

type AuthRole = "parent" | "provider" | "admin"

function resolveDashboardHref(role: unknown): string {
  if (role === "admin") return "/admin"
  if (role === "provider") return "/dashboard/provider"
  return "/dashboard/parent"
}

type HeaderProps = {
  initialMarket: MarketId
  marketOptions: MarketOption[]
}

export function Header({ initialMarket, marketOptions }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [providersOpen, setProvidersOpen] = useState(false)
  const [resolvedRole, setResolvedRole] = useState<AuthRole | null>(null)

  useEffect(() => {
    let cancelled = false

    const resolveRole = async () => {
      try {
        const response = await fetch("/api/auth/role", { cache: "no-store" })
        if (!response.ok) {
          if (!cancelled) setResolvedRole(null)
          return
        }
        const payload = (await response.json()) as { role?: AuthRole }
        if (!cancelled) setResolvedRole(payload.role ?? null)
      } catch {
        if (!cancelled) setResolvedRole(null)
      }
    }

    void resolveRole()
    return () => {
      cancelled = true
    }
  }, [])

  const dashboardHref = useMemo(() => resolveDashboardHref(resolvedRole), [resolvedRole])
  const showDashboardAction = resolvedRole !== null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/twooky-logo.png"
            alt="Twooky logo"
            width={383}
            height={156}
            sizes="(max-width: 1024px) 220px, 260px"
            className="h-15 w-auto sm:h-16"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-6 xl:gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setProvidersOpen(true)}
            onMouseLeave={() => setProvidersOpen(false)}
          >
            <DropdownMenu open={providersOpen} onOpenChange={setProvidersOpen}>
              <DropdownMenuTrigger
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none cursor-pointer"
                aria-label="Explore categories menu"
                onClick={(event) => {
                  event.preventDefault()
                  setProvidersOpen((prev) => !prev)
                }}
              >
                <span>Explore</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="mt-2 max-h-[min(70vh,520px)] overflow-y-auto min-w-[260px] rounded-xl border border-border/70 bg-linear-to-b from-background to-muted/70 p-2 shadow-lg"
              >
                {exploreGroups.map((group, index) => (
                  <div key={group.label}>
                    {index > 0 ? <DropdownMenuSeparator className="my-1.5" /> : null}
                    <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/90">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.links.map((link) => (
                      <DropdownMenuItem
                        key={link.href}
                        asChild
                        className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                      >
                        <Link href={link.href}>{link.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <MarketSelector initialMarket={initialMarket} marketOptions={marketOptions} />
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex lg:items-center lg:gap-2">
          {showDashboardAction ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href={dashboardHref}>Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/for-providers" className="text-inherit">
                  For providers
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-1 lg:hidden">
          <MarketSelector initialMarket={initialMarket} marketOptions={marketOptions} />
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[32rem]" : "max-h-0",
        )}
      >
        <div className="border-t border-border bg-background px-4 py-4 space-y-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block py-2 text-base font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

          <div className="pt-2">
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Explore</div>
            <div className="space-y-4 pl-1">
              {exploreGroups.map((group) => (
                <div key={group.label}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80 mb-1">
                    {group.label}
                  </div>
                  <ul className="space-y-1">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block py-1.5 pl-2 text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            {showDashboardAction ? (
              <Button variant="secondary" className="justify-start" asChild>
                <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link
                    href="/for-providers"
                    className="text-inherit"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    For providers
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
