"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Heart,
  MessageSquare,
  Star,
  Scale,
  Settings,
  Baby,
  ChevronDown,
  Menu,
  Search,
  Store,
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
import { cn } from "@/lib/utils"
import { RequireAuth } from "@/components/RequireAuth"
import { useAuth } from "@/components/AuthProvider"
import { getUserIdentity } from "@/lib/userIdentity"

const sidebarItems = [
  { label: "Dashboard", href: "/dashboard/parent", icon: LayoutDashboard },
  { label: "Saved Providers", href: "/dashboard/parent/saved", icon: Heart },
  { label: "My Inquiries", href: "/dashboard/parent/inquiries", icon: MessageSquare },
  { label: "My Reviews", href: "/dashboard/parent/reviews", icon: Star },
  { label: "Compare Providers", href: "/dashboard/parent/compare", icon: Scale },
  { label: "Local Services & Deals", href: "/dashboard/parent/local-services", icon: Store },
  { label: "Account Settings", href: "/dashboard/parent/settings", icon: Settings },
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
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-primary/90 hover:bg-primary/10"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { signOut, user } = useAuth()
  const identity = getUserIdentity(user, "parent")

  const handleSignOut = async () => {
    await signOut()
    router.replace("/login")
    router.refresh()
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    const params = new URLSearchParams({ q: trimmed, location: trimmed })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <RequireAuth allowedRoles={["parent"]}>
      <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden lg:flex h-screen w-68 flex-col border-r border-border/40 bg-card/95 backdrop-blur">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-border/40">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/90 shadow-sm shadow-black/10">
              <Baby className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground leading-tight">
                Early Learning
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                Parent space
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>

        {/* User section */}
        <div className="border-t border-border/40 p-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/images/parents/sarah.jpg" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {identity.initials}
              </AvatarFallback>
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-card/95 px-4 lg:px-6 backdrop-blur">
          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-xl">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-16 items-center gap-3 px-6 border-b border-border/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/90 shadow-sm shadow-black/10">
                  <Baby className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    Early Learning
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    Parent space
                  </span>
                </div>
              </div>
              <div className="py-4">
                <SidebarNav onItemClick={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative flex" role="search">
              <Input
                type="search"
                name="q"
                placeholder="Search childcare or locations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 rounded-full bg-muted/70 border-0 pl-4 pr-10 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label="Search childcare or locations"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-transparent"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/images/parents/sarah.jpg" />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {identity.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-foreground sm:inline">
                    {identity.name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{identity.name}</p>
                  <p className="text-xs text-muted-foreground">{identity.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/parent/settings">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/parent/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void handleSignOut()} className="text-destructive">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 py-5 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl space-y-6 lg:space-y-8">
            {children}
          </div>
        </main>
      </div>
      </div>
    </RequireAuth>
  )
}
