"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { 
  LayoutDashboard, 
  FileEdit, 
  Star, 
  MessageSquare, 
  Image as ImageIcon, 
  HelpCircle,
  BarChart3, 
  CreditCard, 
  Settings,
  Bell,
  Search,
  LayoutTemplate,
  ChevronDown,
  Menu,
  ArrowRight,
  CheckCircle,
  Flag,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { getSupabaseClient } from "@/lib/supabaseClient"
import {
  canAccessProviderDashboardSection,
  getProviderPlanAccess,
  type ProviderPlanAccess,
} from "@/lib/provider-plan-access"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import { cn } from "@/lib/utils"
import { isProviderWebsiteBuilderEnabled } from "@/lib/website-builder/feature-flag"
import { RequireAuth } from "@/components/RequireAuth"
import { useAuth } from "@/components/AuthProvider"
import { getUserIdentity } from "@/lib/userIdentity"
import type { ProviderNotificationItem } from "@/app/api/provider/notifications/route"
import { ProviderWebsiteNavSection } from "@/components/provider/ProviderWebsiteNavSection"
import type { ProviderDashboardSection } from "@/lib/provider-plan-access"

type SidebarItem = {
  label: string
  href: string
  icon: LucideIcon
  section: ProviderDashboardSection
}

const sidebarItemsAll: SidebarItem[] = [
  { label: "Overview", href: "/dashboard/provider", icon: LayoutDashboard, section: "overview" },
  { label: "Manage Listing & Tour", href: "/dashboard/provider/listing", icon: FileEdit, section: "listing" },
  { label: "Availability", href: "/dashboard/provider/availability", icon: CheckCircle, section: "availability" },
  { label: "Reviews", href: "/dashboard/provider/reviews", icon: Star, section: "reviews" },
  { label: "Inquiries", href: "/dashboard/provider/inquiries", icon: MessageSquare, section: "inquiries" },
  { label: "Photos", href: "/dashboard/provider/photos", icon: ImageIcon, section: "photos" },
  { label: "FAQs", href: "/dashboard/provider/faqs", icon: HelpCircle, section: "faqs" },
  { label: "Website", href: "/dashboard/provider/website", icon: LayoutTemplate, section: "website" },
  { label: "Analytics", href: "/dashboard/provider/analytics", icon: BarChart3, section: "analytics" },
  { label: "Subscription", href: "/dashboard/provider/subscription", icon: CreditCard, section: "subscription" },
  { label: "Settings", href: "/dashboard/provider/settings", icon: Settings, section: "settings" },
]

function SidebarNav({
  onItemClick,
  planAccess,
}: {
  onItemClick?: () => void
  planAccess: ProviderPlanAccess
}) {
  const pathname = usePathname()
  const builderOn = isProviderWebsiteBuilderEnabled()
  const sidebarItems = sidebarItemsAll.filter(
    (item) =>
      canAccessProviderDashboardSection(planAccess.planId, item.section) &&
      (item.href !== "/dashboard/provider/website" || builderOn),
  )

  return (
    <nav className="flex flex-col gap-1 px-3">
      {sidebarItems.map((item) => {
        if (item.href === "/dashboard/provider/website" && builderOn) {
          return <ProviderWebsiteNavSection key="website" onItemClick={onItemClick} />
        }
        const label =
          item.href === "/dashboard/provider/inquiries" && planAccess.isThriveTier ? "Leads (CRM)" : item.label
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            {...(item.href === "/dashboard/provider/photos" ? { "data-tour-photos": "" } : {})}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <item.icon className="h-5 w-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState<ProviderNotificationItem[]>([])
  const pathname = usePathname()
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [publicProfileHref, setPublicProfileHref] = useState("/dashboard/provider/listing")
  const router = useRouter()
  const { signOut, user } = useAuth()
  const identity = getUserIdentity(user, "provider")
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [planAccess, setPlanAccess] = useState<ProviderPlanAccess>(() => getProviderPlanAccess("sprout"))

  const unreadCount = notifications.filter((n) => !n.readAt).length

  async function markNotificationsRead(ids: string[]) {
    if (ids.length === 0) return
    try {
      const res = await fetch("/api/provider/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) return
      const now = new Date().toISOString()
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: now } : n))
      )
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    let cancelled = false

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/provider/notifications", {
          cache: "no-store",
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data.notifications)) {
          setNotifications(data.notifications)
        }
      } catch {
        if (!cancelled) setNotifications([])
      } finally {
        if (!cancelled) setNotificationsLoading(false)
      }
    }

    void fetchNotifications()

    const intervalId = window.setInterval(() => {
      void fetchNotifications()
    }, 30000)

    const refreshOnFocus = () => {
      void fetchNotifications()
    }

    const refreshOnVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchNotifications()
      }
    }

    window.addEventListener("focus", refreshOnFocus)
    document.addEventListener("visibilitychange", refreshOnVisibility)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener("focus", refreshOnFocus)
      document.removeEventListener("visibilitychange", refreshOnVisibility)
    }
  }, [])

  useEffect(() => {
    if (!notificationsOpen) return
    void (async () => {
      try {
        const res = await fetch("/api/provider/notifications", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications)
        }
      } catch {
        // ignore
      } finally {
        setNotificationsLoading(false)
      }
    })()
  }, [notificationsOpen])

  useEffect(() => {
    if (pathname === "/dashboard/provider/search") {
      const q = new URLSearchParams(window.location.search).get("q") ?? ""
      setSearchQuery(q)
    } else {
      setSearchQuery("")
    }
  }, [pathname])

  useEffect(() => {
    let cancelled = false

    async function loadPlanAccess() {
      if (!user) {
        if (!cancelled) setPlanAccess(getProviderPlanAccess("sprout"))
        return
      }

      try {
        const supabase = getSupabaseClient()
        const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
        const { data } = await supabase
          .from("provider_profiles")
          .select("plan_id")
          .eq("profile_id", providerProfileId)
          .maybeSingle()

        if (!cancelled) {
          setPlanAccess(getProviderPlanAccess(data?.plan_id))
        }
      } catch {
        if (!cancelled) {
          setPlanAccess(getProviderPlanAccess("sprout"))
        }
      }
    }

    void loadPlanAccess()

    return () => {
      cancelled = true
    }
  }, [user])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = (e.currentTarget.querySelector('input[name="search"]') as HTMLInputElement | null)
      ?.value?.trim()
    if (q) {
      router.push(`/dashboard/provider/search?q=${encodeURIComponent(q)}`)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function fetchPublicProfileHref() {
      try {
        const res = await fetch("/api/provider/public-profile", { cache: "no-store" })
        if (!res.ok || cancelled) return
        const data = (await res.json().catch(() => ({}))) as { href?: string | null }
        if (!cancelled && data.href) {
          setPublicProfileHref(data.href)
        }
      } catch {
        // keep fallback
      }
    }

    void fetchPublicProfileHref()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <RequireAuth allowedRoles={["provider"]}>
      <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden lg:flex h-screen w-64 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center px-6 border-b border-border">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/images/twooky-logo.png"
              alt="Twooky logo"
              width={383}
              height={156}
              sizes="180px"
              className="h-10 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav planAccess={planAccess} />
        </div>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-primary/10 text-primary">{identity.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{identity.name}</p>
              <p className="text-xs text-muted-foreground truncate">{identity.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center justify-center px-6 border-b border-border">
                <Image
                  src="/images/twooky-logo.png"
                  alt="Twooky logo"
                  width={383}
                  height={156}
                  sizes="180px"
                  className="h-10 w-auto"
                />
              </div>
              <div className="py-4">
                <SidebarNav planAccess={planAccess} onItemClick={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Search */}
          {planAccess.canAccessProviderSearch ? (
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  type="search"
                  placeholder="Search inquiries and reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
            </form>
          ) : (
            <div className="flex-1" />
          )}

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu onOpenChange={setNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-4 pb-3 bg-muted/40 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      <p className="text-xs text-muted-foreground">Latest inquiries and reviews</p>
                    </div>
                  </div>
                </div>
                {/* Notification list */}
                <div className="max-h-[320px] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Loading…
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No new inquiries or reviews
                    </div>
                  ) : (
                    <>
                      {notifications.map((item) => (
                        <DropdownMenuItem key={item.id} asChild className="p-0 focus:bg-accent/50">
                          <Link
                            href={item.href}
                            onClick={() => markNotificationsRead([item.id])}
                            className={cn(
                              "group flex gap-3 px-4 py-3 rounded-none border-b border-border/60 last:border-0 outline-none hover:bg-accent/50 focus:bg-accent/50",
                              item.readAt && "opacity-75"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                item.type === "inquiry"
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : item.type === "listing_confirmed"
                                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                    : item.type === "review_report_accepted"
                                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              )}
                            >
                              {item.type === "inquiry" ? (
                                <MessageSquare className="h-5 w-5" />
                              ) : item.type === "listing_confirmed" ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : item.type === "review_report_accepted" ? (
                                <Flag className="h-5 w-5" />
                              ) : (
                                <Star className="h-5 w-5 fill-current" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <span
                                className={cn(
                                  "text-[10px] font-semibold uppercase tracking-wider",
                                  item.type === "inquiry"
                                    ? "text-blue-600 dark:text-blue-400"
                                    : item.type === "listing_confirmed"
                                      ? "text-green-600 dark:text-green-400"
                                      : item.type === "review_report_accepted"
                                        ? "text-violet-600 dark:text-violet-400"
                                        : "text-amber-600 dark:text-amber-400"
                                )}
                              >
                                {item.type === "inquiry"
                                  ? "Inquiry"
                                  : item.type === "listing_confirmed"
                                    ? "Listing confirmed"
                                    : item.type === "review_report_accepted"
                                      ? "Report update"
                                      : "Review"}
                              </span>
                              <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {item.message}
                              </p>
                              <span className="text-[11px] text-muted-foreground mt-1.5 block">
                                {item.time}
                              </span>
                            </div>
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </div>
                {/* Footer: mark all read + links */}
                <div className="border-t border-border bg-muted/30 px-2 py-2 flex flex-col gap-0.5">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground hover:text-foreground"
                      onClick={() => markNotificationsRead(notifications.map((n) => n.id))}
                    >
                      Mark all as read
                    </Button>
                  )}
                  {planAccess.canAccessInquiries ? (
                    <DropdownMenuItem asChild className="rounded-md py-2.5">
                      <Link
                        href="/dashboard/provider/inquiries"
                        className="flex items-center gap-2 text-sm font-medium text-foreground w-full"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        View all inquiries
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  {planAccess.canAccessReviews ? (
                    <DropdownMenuItem asChild className="rounded-md py-2.5">
                      <Link
                        href="/dashboard/provider/reviews"
                        className="flex items-center gap-2 text-sm font-medium text-foreground w-full"
                      >
                        <Star className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        View all reviews
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{identity.initials}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{identity.name}</p>
                  <p className="text-xs text-muted-foreground">{identity.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/provider/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={publicProfileHref} target="_blank" rel="noopener noreferrer">
                    View Public Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleSignOut()} className="text-destructive">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
      </div>
    </RequireAuth>
  )
}
