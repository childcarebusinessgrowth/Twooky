"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  UsersRound,
  FileCheck,
  Bell,
  Search,
  ChevronDown,
  Menu,
  Shield,
  Newspaper,
  FolderTree,
} from "lucide-react"
import { useState } from "react"
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
import { RequireAuth } from "@/components/RequireAuth"
import { useAuth } from "@/components/AuthProvider"
import { getUserIdentity } from "@/lib/userIdentity"

const sidebarItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Listings", href: "/admin/listings", icon: Building2 },
  { label: "Parents", href: "/admin/parents", icon: UsersRound },
  { label: "Blogs", href: "/admin/blogs", icon: Newspaper },
  { label: "Claim Requests", href: "/admin/claims", icon: FileCheck, badge: 3 },
  { label: "Directory", href: "/admin/directory", icon: FolderTree },
]

const adminNotificationItems = [
  {
    id: 1,
    type: "claim" as const,
    title: "New claim request: Happy Kids Academy",
    time: "5 minutes ago",
    href: "/admin/claims",
  },
  {
    id: 2,
    type: "claim" as const,
    title: "Claim request needs review",
    time: "15 minutes ago",
    href: "/admin/claims",
  },
  {
    id: 3,
    type: "listing" as const,
    title: "Sunshine Daycare updated their listing",
    time: "1 hour ago",
    href: "/admin/listings",
  },
]

function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3">
      {sidebarItems.map((item) => {
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
              <item.icon className="h-5 w-5" />
              {item.label}
            </span>
            {item.badge && (
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

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { signOut, user } = useAuth()
  const identity = getUserIdentity(user, "admin")

  const handleSignOut = async () => {
    await signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <div className="min-h-screen bg-muted/30">
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex">
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
                <Shield className="h-4 w-4 text-background" />
              </div>
              <span className="font-bold text-foreground">ELD Admin</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <SidebarNav />
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
                <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
                    <Shield className="h-4 w-4 text-background" />
                  </div>
                  <span className="font-bold text-foreground">ELD Admin</span>
                </div>
                <div className="py-4">
                  <SidebarNav onItemClick={() => setMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="max-w-md flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search listings, users..." className="border-0 bg-muted/50 pl-9 focus-visible:ring-1" />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">Notifications</p>
                    <p className="text-xs text-muted-foreground">Latest platform activity</p>
                  </div>
                  <DropdownMenuSeparator />
                  {adminNotificationItems.map((item) => (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link href={item.href} className="flex flex-col items-start gap-0.5">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">{item.type}</span>
                        <span className="w-full truncate text-sm font-medium text-foreground">{item.title}</span>
                        <span className="mt-0.5 text-[11px] text-muted-foreground">{item.time}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/claims" className="text-sm">
                      View all claims
                    </Link>
                  </DropdownMenuItem>
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
