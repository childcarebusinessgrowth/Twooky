"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketId } from "@/lib/market"
import type { MarketOption } from "@/lib/market-options"
import { getPublicProviderTypeLabel } from "@/lib/listing-labels"
import { MarketSelector } from "@/components/market-selector"
import { getSupabaseClient } from "@/lib/supabaseClient"

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
  { name: "Parents area", href: "/parents" },
]

const aboutMenuLinks = [
  { name: "Locations", href: "/provider/locations" },
  { name: "Contact", href: "/contact" },
]

const mobileNavigation = [
  { name: "Home", href: "/" },
  { name: "Parents area", href: "/parents" },
  { name: "About", href: "/about" },
  { name: "Locations", href: "/provider/locations" },
  { name: "Contact", href: "/contact" },
]

type ExploreLink = {
  name: string
  href: string
}

type ExploreGroup = {
  label: string
  links: ExploreLink[]
}

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
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false)
  const [providersOpen, setProvidersOpen] = useState(false)
  const [providerMenuOpen, setProviderMenuOpen] = useState(false)
  const [exploreGroups, setExploreGroups] = useState<ExploreGroup[]>([])
  const [exploreLoading, setExploreLoading] = useState(true)
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

    const supabase = getSupabaseClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return

      if (!session?.user || event === "SIGNED_OUT") {
        setResolvedRole(null)
        return
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void resolveRole()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadExploreGroups() {
      setExploreLoading(true)
      setExploreGroups([])
      try {
        const response = await fetch("/api/search/options", { cache: "no-store" })
        if (!response.ok) return

        const payload = (await response.json()) as {
          providerTaxonomy?: {
            providerTypes?: Array<{
              name?: string
              slug?: string
              category_name?: string
            }>
          }
        }

        const grouped = new Map<string, ExploreGroup>()
        for (const item of payload.providerTaxonomy?.providerTypes ?? []) {
          const name = item?.name?.trim()
          const slug = item?.slug?.trim()
          const categoryName = item?.category_name?.trim()
          if (!name || !slug || !categoryName) continue
          const href = `/${encodeURIComponent(slug)}`
          const current = grouped.get(categoryName) ?? { label: categoryName, links: [] }
          current.links.push({ name: getPublicProviderTypeLabel(name, initialMarket), href })
          grouped.set(categoryName, current)
        }

        if (!cancelled) {
          setExploreGroups(Array.from(grouped.values()))
        }
      } catch {
        // Leave the menu empty if taxonomy loading fails.
      } finally {
        if (!cancelled) setExploreLoading(false)
      }
    }

    void loadExploreGroups()

    return () => {
      cancelled = true
    }
  }, [initialMarket])

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
            onMouseEnter={() => setAboutMenuOpen(true)}
            onMouseLeave={() => setAboutMenuOpen(false)}
          >
            <div className="flex items-center gap-1">
              <Link
                href="/about"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                About
              </Link>
              <DropdownMenu open={aboutMenuOpen} onOpenChange={setAboutMenuOpen}>
                <DropdownMenuTrigger
                  className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none cursor-pointer"
                  aria-label="About menu"
                  onClick={(event) => {
                    event.preventDefault()
                    setAboutMenuOpen((prev) => !prev)
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="mt-2 min-w-[220px] rounded-xl border border-border/70 bg-linear-to-b from-background to-muted/70 p-2 shadow-lg"
                >
                  {aboutMenuLinks.map((link) => (
                    <DropdownMenuItem
                      key={link.href}
                      asChild
                      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Link href={link.href} onClick={() => setAboutMenuOpen(false)}>
                        {link.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

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
                className="mt-2 w-[min(92vw,760px)] min-w-[280px] rounded-xl border border-border/70 bg-linear-to-b from-background to-muted/70 p-3 shadow-lg"
              >
                {exploreLoading ? (
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/90">
                    Loading...
                  </DropdownMenuLabel>
                ) : exploreGroups.length === 0 ? (
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground/90">
                    No explore categories yet
                  </DropdownMenuLabel>
                ) : (
                  <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                    {exploreGroups.map((group) => (
                      <div key={group.label} className="space-y-1.5">
                        <DropdownMenuLabel className="px-0 text-[11px] uppercase tracking-wide text-muted-foreground/90">
                          {group.label}
                        </DropdownMenuLabel>
                        <div className="space-y-1">
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
                      </div>
                    ))}
                  </div>
                )}
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
              <DropdownMenu open={providerMenuOpen} onOpenChange={setProviderMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
                  >
                    <span>For providers</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="mt-2 min-w-[240px] rounded-xl border border-border/70 bg-linear-to-b from-background to-muted/60 p-2 shadow-lg"
                >
                  <DropdownMenuLabel className="px-3 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground/90">
                    For providers
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    asChild
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Link href="/for-providers" onClick={() => setProviderMenuOpen(false)}>
                      Get started
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Link href="/pricing" onClick={() => setProviderMenuOpen(false)}>
                      Pricing
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          mobileMenuOpen ? "max-h-128" : "max-h-0",
        )}
      >
        <div className="border-t border-border bg-background px-4 py-4 space-y-3">
          {mobileNavigation.map((item) => (
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
                <div className="rounded-xl border border-border/70 bg-linear-to-b from-background to-muted/50 p-3 shadow-xs">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    For providers
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground/80">Tools and plans for your business</div>
                  <Link
                    href="/for-providers"
                    className="mt-3 block rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get started
                  </Link>
                  <Link
                    href="/pricing"
                    className="mt-1 block rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
