"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  FileEdit, 
  Star, 
  MessageSquare, 
  Image, 
  BarChart3, 
  CreditCard, 
  Settings,
  GraduationCap,
  Bell,
  Search,
  ChevronDown,
  Menu,
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
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { RequireAuth } from "@/components/RequireAuth"
import { useAuth } from "@/components/AuthProvider"
import { getUserIdentity } from "@/lib/userIdentity"

const sidebarItems = [
  { label: "Overview", href: "/dashboard/provider", icon: LayoutDashboard },
  { label: "Manage Listing & Tour", href: "/dashboard/provider/listing", icon: FileEdit },
  { label: "Reviews", href: "/dashboard/provider/reviews", icon: Star },
  { label: "Inquiries", href: "/dashboard/provider/inquiries", icon: MessageSquare },
  { label: "Photos", href: "/dashboard/provider/photos", icon: Image },
  { label: "Analytics", href: "/dashboard/provider/analytics", icon: BarChart3 },
  { label: "Subscription", href: "/dashboard/provider/subscription", icon: CreditCard },
  { label: "Settings", href: "/dashboard/provider/settings", icon: Settings },
]

const notificationItems = [
  {
    id: 1,
    type: "inquiry" as const,
    title: "New inquiry from Sarah Johnson",
    message: "Interested in your toddler program...",
    time: "Today, 2:30 PM",
    href: "/dashboard/provider/inquiries",
  },
  {
    id: 2,
    type: "inquiry" as const,
    title: "New inquiry from Michael Chen",
    message: "Looking for preschool starting September...",
    time: "Today, 11:15 AM",
    href: "/dashboard/provider/inquiries",
  },
  {
    id: 3,
    type: "review" as const,
    title: "New 5★ review from Emily Williams",
    message: "“We absolutely love Sunshine Daycare...”",
    time: "Yesterday",
    href: "/dashboard/provider/reviews",
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
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
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

export default function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { signOut, user } = useAuth()
  const identity = getUserIdentity(user, "provider")

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
        <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">ELD Provider</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
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
              <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">ELD Provider</span>
              </div>
              <div className="py-4">
                <SidebarNav onItemClick={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">Latest inquiries and reviews</p>
                </div>
                <DropdownMenuSeparator />
                {notificationItems.map((item) => (
                  <DropdownMenuItem key={item.id} asChild>
                    <Link href={item.href} className="flex flex-col items-start gap-0.5">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {item.type === "inquiry" ? "Inquiry" : "Review"}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate w-full">
                        {item.title}
                      </span>
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {item.message}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">
                        {item.time}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/provider/inquiries" className="text-sm">
                    View all inquiries
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/provider/reviews" className="text-sm">
                    View all reviews
                  </Link>
                </DropdownMenuItem>
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
                  <Link href="/providers/sunshine-learning-center">View Public Profile</Link>
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
