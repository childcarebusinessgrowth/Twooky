"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Mail, Calendar, User, UsersRound, MoreVertical, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { activateParent, deactivateParent, deleteParent } from "./actions"
import type { ParentProfile } from "./page"

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function getInitials(displayName: string | null, email: string): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }
  const local = email.split("@")[0]
  if (local.length >= 2) return local.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

type ParentCardProps = {
  parent: ParentProfile
  onAction: () => void
}

function ParentCard({ parent, onAction }: ParentCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const location = [parent.city_name, parent.country_name].filter(Boolean).join(", ") || "—"
  const displayName = parent.display_name?.trim() || "No name set"
  const active = parent.is_active ?? true

  async function handleActivate() {
    setLoading(true)
    const result = await activateParent(parent.id)
    setLoading(false)
    if (result.ok) {
      toast({ title: "Parent activated", variant: "success" })
      router.refresh()
      onAction()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  async function handleDeactivate() {
    setLoading(true)
    const result = await deactivateParent(parent.id)
    setLoading(false)
    if (result.ok) {
      toast({ title: "Parent deactivated", variant: "success" })
      router.refresh()
      onAction()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  async function handleDelete() {
    setDeleteOpen(false)
    setLoading(true)
    const result = await deleteParent(parent.id)
    setLoading(false)
    if (result.ok) {
      toast({ title: "Parent deleted", variant: "success" })
      router.refresh()
      onAction()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  return (
    <>
      <Card className="group border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <Avatar className="h-14 w-14 shrink-0 border-2 border-background shadow-md ring-1 ring-border/50">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {getInitials(parent.display_name, parent.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{displayName}</p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{parent.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant={active ? "default" : "secondary"}
                    className={active ? "bg-emerald-600/90" : "bg-muted text-muted-foreground"}
                  >
                    {active ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!active && (
                        <DropdownMenuItem onClick={handleActivate} disabled={loading}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Activate
                        </DropdownMenuItem>
                      )}
                      {active && (
                        <DropdownMenuItem onClick={handleDeactivate} disabled={loading}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteOpen(true)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {location}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  Joined {formatDate(parent.created_at)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete parent account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for {parent.email}. They will no longer be able to sign in. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type Props = {
  initialParents: ParentProfile[]
  loadError: string | null
}

export function ParentsPageClient({ initialParents, loadError }: Props) {
  const [search, setSearch] = useState("")

  const filteredParents = useMemo(() => {
    if (!search.trim()) return initialParents
    const q = search.trim().toLowerCase()
    return initialParents.filter(
      (p) =>
        p.email.toLowerCase().includes(q) ||
        (p.display_name?.toLowerCase().includes(q) ?? false) ||
        (p.city_name?.toLowerCase().includes(q) ?? false) ||
        (p.country_name?.toLowerCase().includes(q) ?? false)
    )
  }, [initialParents, search])

  const newThisMonth = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return initialParents.filter((p) => new Date(p.created_at) >= start).length
  }, [initialParents])

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parents</h1>
          <p className="text-muted-foreground">View and manage parent accounts</p>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-destructive font-medium">Could not load parents</p>
            <p className="text-sm text-muted-foreground mt-1">{loadError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/12 via-primary/6 to-transparent border border-primary/10 p-6 sm:p-8">
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Parents
              </h1>
              <p className="mt-1 text-muted-foreground">
                All parent accounts and their details
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-medium">
                <UsersRound className="h-4 w-4" />
                {initialParents.length} total
              </Badge>
              {newThisMonth > 0 && (
                <Badge className="gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary/90">
                  <User className="h-4 w-4" />
                  {newThisMonth} new this month
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, email, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-xl border-border/60 bg-background/80"
        />
      </div>

      {/* Content */}
      {filteredParents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UsersRound className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium text-foreground">
              {search.trim() ? "No parents match your search" : "No parents yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {search.trim()
                ? "Try a different name, email, or location."
                : "Parent accounts will appear here once they sign up."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredParents.map((parent) => (
            <ParentCard key={parent.id} parent={parent} onAction={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}
