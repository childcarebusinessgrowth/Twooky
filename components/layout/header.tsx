"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Baby, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/AuthProvider"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Programs", href: "/programs" },
  { name: "Locations", href: "/childcare/locations" },
]

const providerLinks = [
  { name: "Nurseries", href: "/nurseries" },
  { name: "Preschools", href: "/preschools" },
  { name: "Afterschool Programs", href: "/afterschool-programs" },
  { name: "Sports Academies", href: "/sports-academies" },
  { name: "Holiday Camps", href: "/holiday-camps" },
  { name: "Tutoring", href: "/tutoring" },
  { name: "Therapy Services", href: "/therapy-services" },
]

type AuthRole = "parent" | "provider" | "admin"

function resolveDashboardHref(role: unknown): string {
  if (role === "admin") return "/admin"
  if (role === "provider") return "/dashboard/provider"
  return "/dashboard/parent"
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [providersOpen, setProvidersOpen] = useState(false)
  const [isAuthResolved, setIsAuthResolved] = useState(false)
  const [isServerAuthenticated, setIsServerAuthenticated] = useState(false)
  const [dashboardHref, setDashboardHref] = useState("/dashboard/parent")
  const { user, loading } = useAuth()

  const roleFromAppMetadata = user?.app_metadata?.role
  const roleFromUserMetadata = user?.user_metadata?.role
  const role = (roleFromAppMetadata ?? roleFromUserMetadata) as AuthRole | undefined
  useEffect(() => {
    let cancelled = false

    async function resolveServerAuth() {
      if (loading) return
      if (!user) {
        if (!cancelled) {
          setIsServerAuthenticated(false)
          setDashboardHref(resolveDashboardHref(role))
          setIsAuthResolved(true)
        }
        return
      }

      try {
        const response = await fetch("/api/auth/role", { cache: "no-store" })
        const payload = (await response.json().catch(() => ({}))) as {
          redirectPath?: string
          unresolvedRole?: boolean
        }

        if (cancelled) return

        if (response.ok && payload.redirectPath) {
          setIsServerAuthenticated(true)
          setDashboardHref(payload.redirectPath)
        } else {
          setIsServerAuthenticated(false)
          setDashboardHref(resolveDashboardHref(role))
        }
      } catch {
        if (!cancelled) {
          setIsServerAuthenticated(false)
          setDashboardHref(resolveDashboardHref(role))
        }
      } finally {
        if (!cancelled) {
          setIsAuthResolved(true)
        }
      }
    }

    setIsAuthResolved(false)
    void resolveServerAuth()

    return () => {
      cancelled = true
    }
  }, [loading, role, user])

  const showDashboardAction = !loading && isAuthResolved && isServerAuthenticated

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Baby className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">
            Early Learning Directory
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
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
                aria-label="Providers menu"
                onClick={(event) => {
                  // Allow click to toggle as well
                  event.preventDefault()
                  setProvidersOpen((prev) => !prev)
                }}
              >
                <span>Providers</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="mt-2 min-w-[230px] rounded-xl border border-border/70 bg-linear-to-b from-background to-muted/70 p-2 shadow-lg"
              >
                {providerLinks.map((provider) => (
                  <DropdownMenuItem
                    key={provider.name}
                    asChild
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Link href={provider.href}>{provider.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex lg:items-center lg:gap-3">
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
                <Link href="/claim-listing" className="text-inherit">Claim Your Listing</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-accent"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Toggle menu</span>
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-96" : "max-h-0"
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
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Providers
            </div>
            {providerLinks.map((provider) => (
              <Link
                key={provider.name}
                href={provider.href}
                className="block py-1.5 pl-3 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {provider.name}
              </Link>
            ))}
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
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link href="/claim-listing" className="text-inherit" onClick={() => setMobileMenuOpen(false)}>Claim Your Listing</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
