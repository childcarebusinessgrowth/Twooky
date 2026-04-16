"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  UsersRound,
  FileCheck,
  Bell,
  Search,
  ChevronDown,
  Menu,
  Newspaper,
  FolderTree,
  BarChart3,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Star,
  CreditCard,
  Flag,
  Handshake,
  Shield,
  Megaphone,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { RequireAuth } from "@/components/RequireAuth"
import { useAuth } from "@/components/AuthProvider"
import { getUserIdentity } from "@/lib/userIdentity"
import type { AdminNotificationItem } from "@/app/api/admin/notifications/route"
import { getSupabaseClient } from "@/lib/supabaseClient"
import type { LucideIcon } from "lucide-react"
import { canAccessAdminPath, type AdminPermission, type AdminTeamRole } from "@/lib/authz"

type SidebarLinkItem = {
  kind: "link"
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

type SidebarGroupItem = {
  kind: "group"
  label: string
  icon: LucideIcon
  children: { label: string; href: string }[]
}

function getSidebarItems(
  pendingClaimsCount: number,
  canManageTeam: boolean,
  teamRole: AdminTeamRole | null,
  permissions: readonly AdminPermission[],
): (SidebarLinkItem | SidebarGroupItem)[] {
  if (!teamRole) return []

  const canAccess = (path: string) => canAccessAdminPath(teamRole, path)
  const hasPermission = (permission: AdminPermission) => permissions.includes(permission)
  const items: (SidebarLinkItem | SidebarGroupItem)[] = [
  ]
  if (canAccess("/admin")) {
    items.push({ kind: "link", label: "Dashboard", href: "/admin", icon: LayoutDashboard })
  }
  if (canAccess("/admin/listings")) {
    items.push({ kind: "link", label: "Listings", href: "/admin/listings", icon: Building2 })
  }
  if (canAccess("/admin/provider-plans")) {
    items.push({ kind: "link", label: "Provider Plans", href: "/admin/provider-plans", icon: CreditCard })
  }
  if (canAccess("/admin/parents")) {
    items.push({ kind: "link", label: "Parents", href: "/admin/parents", icon: UsersRound })
  }
  if (canAccess("/admin/blogs")) {
    items.push({ kind: "link", label: "Blogs", href: "/admin/blogs", icon: Newspaper })
  }
  if (canAccess("/admin/sponsors")) {
    items.push({
      kind: "group",
      label: "Sponsors & Advertisers",
      icon: Handshake,
      children: [
        { label: "Discounts", href: "/admin/sponsors/discounts" },
        { label: "Local Services & Deals", href: "/admin/sponsors/local-services" },
      ],
    })
  }
  if (canAccess("/admin/contact-messages")) {
    items.push({ kind: "link", label: "Contact messages", href: "/admin/contact-messages", icon: MessageCircle })
  }
  if (canAccess("/admin/reviews")) {
    items.push({ kind: "link", label: "Reviews", href: "/admin/reviews", icon: Star })
  }
  if (canAccess("/admin/social-proof")) {
    items.push({ kind: "link", label: "Social Proof", href: "/admin/social-proof", icon: Megaphone })
  }
  if (canAccess("/admin/claims") && hasPermission("badges.verify")) {
    items.push({
      kind: "link",
      label: "Claim Requests",
      href: "/admin/claims",
      icon: FileCheck,
      badge: pendingClaimsCount,
    })
  }
  if (canAccess("/admin/directory")) {
    items.push({ kind: "link", label: "Directory", href: "/admin/directory", icon: FolderTree })
  }
  if (canAccess("/admin/analytics")) {
    items.push({ kind: "link", label: "Analytics", href: "/admin/analytics", icon: BarChart3 })
  }
  if (canManageTeam) {
    items.push({ kind: "link", label: "Team", href: "/admin/team", icon: Shield })
  }
  return items
}

function SidebarNav({
  onItemClick,
  pendingClaimsCount,
  canManageTeam,
  teamRole,
  permissions,
}: {
  onItemClick?: () => void
  pendingClaimsCount: number
  canManageTeam: boolean
  teamRole: AdminTeamRole | null
  permissions: readonly AdminPermission[]
}) {
  const pathname = usePathname()
  const sidebarItems = getSidebarItems(pendingClaimsCount, canManageTeam, teamRole, permissions)

  return (
    <nav className="flex flex-col gap-1 px-3">
      {sidebarItems.map((item) => {
        if (item.kind === "group") {
          const groupPathPrefix = "/admin/sponsors"
          const hasActiveChild = item.children.some((c) => pathname === c.href)
          return (
            <AdminSidebarGroup
              key={item.label}
              item={item}
              pathname={pathname}
              groupPathPrefix={groupPathPrefix}
              hasActiveChild={hasActiveChild}
              onItemClick={onItemClick}
            />
          )
        }

        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </span>
            {item.badge != null && item.badge > 0 && (
              <Badge variant={isActive ? "secondary" : "default"} className="flex h-5 min-w-5 items-center justify-center text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function AdminSidebarGroup({
  item,
  pathname,
  groupPathPrefix,
  hasActiveChild,
  onItemClick,
}: {
  item: SidebarGroupItem
  pathname: string
  groupPathPrefix: string
  hasActiveChild: boolean
  onItemClick?: () => void
}) {
  const [manualOpen, setManualOpen] = useState(() => pathname.startsWith(groupPathPrefix))
  const Icon = item.icon
  const isRouteOpen = pathname.startsWith(groupPathPrefix)
  const open = isRouteOpen || manualOpen

  return (
    <Collapsible open={open} onOpenChange={setManualOpen}>
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          hasActiveChild
            ? "bg-primary/15 text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5 shrink-0" />
          {item.label}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-0.5 pl-2">
        <div className="ml-2 border-l border-border pl-2">
          {item.children.map((child) => {
            const childActive = pathname === child.href
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onItemClick}
                className={cn(
                  "flex rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  childActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AdminLayoutClient({
  children,
  pendingClaimsCount = 0,
  canManageTeam = false,
  teamRole = null,
  permissions = [],
}: {
  children: React.ReactNode
  pendingClaimsCount?: number
  canManageTeam?: boolean
  teamRole?: AdminTeamRole | null
  permissions?: readonly AdminPermission[]
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [headerSearch, setHeaderSearch] = useState("")
  const router = useRouter()
  const { signOut, user } = useAuth()
  const identity = getUserIdentity(user, "admin")
  const unreadCount = notifications.filter((n) => !n.readAt).length

  useEffect(() => {
    if (pathname.startsWith("/admin/listings")) return
    setHeaderSearch(searchParams.get("search") ?? "")
  }, [pathname, searchParams])

  const runHeaderSearch = useCallback(() => {
    const q = headerSearch.trim()
    const base =
      pathname.startsWith("/admin/parents")
        ? "/admin/parents"
        : pathname.startsWith("/admin/listings")
          ? "/admin/listings"
          : "/admin/listings"

    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "1")
    if (q) next.set("search", q)
    else next.delete("search")

    router.push(`${base}?${next.toString()}`)
  }, [headerSearch, pathname, router, searchParams])

  async function markNotificationsRead(ids: string[]) {
    if (ids.length === 0) return
    try {
      const res = await fetch("/api/admin/notifications", {
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

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications")
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications)
      }
    } catch {
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/admin/notifications")
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
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    try {
      const supabase = getSupabaseClient()
      const channel = supabase
        .channel("admin-notifications-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "admin_notifications" },
          () => {
            if (!cancelled) {
              void fetchNotifications()
              router.refresh()
            }
          }
        )
        .subscribe()

      return () => {
        cancelled = true
        void supabase.removeChannel(channel)
      }
    } catch {
      return () => {
        cancelled = true
      }
    }
  }, [fetchNotifications, router])

  const handleSignOut = async () => {
    await signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <div className="min-h-screen bg-muted/30">
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex">
          <div className="flex h-16 items-center justify-center border-b border-border px-6">
            <Link href="/admin" className="flex items-center justify-center">
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

          <div className="flex-1 overflow-y-auto py-4">
            <SidebarNav
              pendingClaimsCount={pendingClaimsCount}
              canManageTeam={canManageTeam}
              teamRole={teamRole}
              permissions={permissions}
            />
          </div>

          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-foreground text-background">{identity.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{identity.name}</p>
                <p className="truncate text-xs text-muted-foreground">{identity.email}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center justify-center border-b border-border px-6">
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
                  <SidebarNav
                    onItemClick={() => setMobileMenuOpen(false)}
                    pendingClaimsCount={pendingClaimsCount}
                    canManageTeam={canManageTeam}
                    teamRole={teamRole}
                    permissions={permissions}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="max-w-md flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search listings, users..."
                  className="border-0 bg-muted/50 pl-9 focus-visible:ring-1"
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") runHeaderSearch()
                  }}
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden">
                  <div className="px-4 pt-4 pb-3 bg-muted/40 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Notifications</p>
                        <p className="text-xs text-muted-foreground">Latest platform activity</p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No notifications yet
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
                                  item.type === "provider_signup"
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : item.type === "contact_message"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : item.type === "listing_pending"
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        : item.type === "claim_request"
                                          ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                                          : item.type === "review_report"
                                            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                )}
                              >
                                {item.type === "provider_signup" ? (
                                  <UsersRound className="h-5 w-5" />
                                ) : item.type === "contact_message" ? (
                                  <MessageCircle className="h-5 w-5" />
                                ) : item.type === "listing_pending" ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : item.type === "claim_request" ? (
                                  <FileCheck className="h-5 w-5" />
                                ) : item.type === "review_report" ? (
                                  <Flag className="h-5 w-5" />
                                ) : (
                                  <Star className="h-5 w-5 fill-current" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <span
                                  className={cn(
                                    "text-[10px] font-semibold uppercase tracking-wider",
                                    item.type === "provider_signup"
                                      ? "text-blue-600 dark:text-blue-400"
                                      : item.type === "contact_message"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : item.type === "listing_pending"
                                          ? "text-amber-600 dark:text-amber-400"
                                          : item.type === "claim_request"
                                            ? "text-teal-600 dark:text-teal-400"
                                            : item.type === "review_report"
                                              ? "text-violet-600 dark:text-violet-400"
                                              : "text-rose-600 dark:text-rose-400"
                                  )}
                                >
                                  {item.type === "provider_signup"
                                    ? "Provider signup"
                                    : item.type === "contact_message"
                                      ? "Contact"
                                      : item.type === "listing_pending"
                                        ? "Listing"
                                        : item.type === "claim_request"
                                          ? "Claim request"
                                          : item.type === "review_report"
                                            ? "Review report"
                                            : "Moderation"}
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
                    <DropdownMenuItem asChild className="rounded-md py-2.5">
                      <Link href="/admin/listings" className="flex items-center gap-2 text-sm font-medium text-foreground w-full">
                        <Building2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        View pending listings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-md py-2.5">
                      <Link href="/admin/contact-messages" className="flex items-center gap-2 text-sm font-medium text-foreground w-full">
                        <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        View contact messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-md py-2.5">
                      <Link href="/admin/claims" className="flex items-center gap-2 text-sm font-medium text-foreground w-full">
                        <FileCheck className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                        View claim requests
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-md py-2.5">
                      <Link
                        href="/admin/reviews?reports=1"
                        className="flex items-center gap-2 text-sm font-medium text-foreground w-full"
                      >
                        <Flag className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                        Reported reviews queue
                      </Link>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-foreground text-sm text-background">{identity.initials}</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{identity.name}</p>
                    <p className="text-xs text-muted-foreground">{identity.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void handleSignOut()} className="text-destructive">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </RequireAuth>
  )
}
