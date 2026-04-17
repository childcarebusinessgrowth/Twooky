"use client"

import { useState, useTransition } from "react"
import { Award, Edit2, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { DirectoryBadge } from "@/components/directory-badge"
import { useToast } from "@/hooks/use-toast"
import {
  DIRECTORY_BADGE_COLORS,
  DIRECTORY_BADGE_ICONS,
  normalizeDirectoryBadgeColor,
  normalizeDirectoryBadgeIcon,
  type DirectoryBadgeView,
} from "@/lib/directory-badges"
import { createDirectoryBadge, deleteDirectoryBadge, updateDirectoryBadge } from "./actions"

type BadgeRow = {
  id: string
  name: string
  description: string
  color: string
  icon: string
  is_active: boolean
}

type Props = {
  initialBadges: BadgeRow[]
}

type FormState = {
  name: string
  description: string
  color: string
  icon: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  color: "blue",
  icon: "award",
  isActive: true,
}

const ICON_OPTIONS = Object.entries(DIRECTORY_BADGE_ICONS) as Array<
  [keyof typeof DIRECTORY_BADGE_ICONS, (typeof DIRECTORY_BADGE_ICONS)[keyof typeof DIRECTORY_BADGE_ICONS]]
>

function formatIconLabel(iconKey: string): string {
  return iconKey
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (value) => value.toUpperCase())
}

export function AdminBadgesPageClient({ initialBadges }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeRow | null>(null)
  const [badgeToDelete, setBadgeToDelete] = useState<BadgeRow | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const SelectedIcon = DIRECTORY_BADGE_ICONS[normalizeDirectoryBadgeIcon(form.icon)]

  const badges: DirectoryBadgeView[] = initialBadges.map((badge) => ({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    color: normalizeDirectoryBadgeColor(badge.color),
    icon: normalizeDirectoryBadgeIcon(badge.icon),
  }))

  const openCreateDialog = () => {
    setEditingBadge(null)
    setForm(EMPTY_FORM)
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (badge: BadgeRow) => {
    setEditingBadge(badge)
    setForm({
      name: badge.name,
      description: badge.description,
      color: normalizeDirectoryBadgeColor(badge.color),
      icon: normalizeDirectoryBadgeIcon(badge.icon),
      isActive: badge.is_active,
    })
    setError(null)
    setDialogOpen(true)
  }

  const handleSave = () => {
    const trimmedName = form.name.trim()
    const trimmedDescription = form.description.trim()

    if (!trimmedName) {
      setError("Badge name is required.")
      return
    }
    if (!trimmedDescription) {
      setError("Badge description is required.")
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        if (editingBadge) {
          await updateDirectoryBadge(editingBadge.id, {
            name: trimmedName,
            description: trimmedDescription,
            color: form.color,
            icon: form.icon,
            isActive: form.isActive,
          })
          toast({ title: "Badge updated.", variant: "success" })
        } else {
          await createDirectoryBadge({
            name: trimmedName,
            description: trimmedDescription,
            color: form.color,
            icon: form.icon,
            isActive: form.isActive,
          })
          toast({ title: "Badge created.", variant: "success" })
        }
        setDialogOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save badge.")
      }
    })
  }

  const handleDeleteConfirm = async () => {
    if (!badgeToDelete) return
    try {
      await deleteDirectoryBadge(badgeToDelete.id)
      setDeleteDialogOpen(false)
      setBadgeToDelete(null)
      toast({ title: "Badge removed.", variant: "success" })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove badge.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Award className="h-6 w-6" />
          Badges
        </h1>
        <p className="text-muted-foreground">
          Manage dynamic badges used on provider listings.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Directory Badges</CardTitle>
            <CardDescription>These badges can be assigned to providers by admins.</CardDescription>
          </div>
          <Button size="sm" onClick={openCreateDialog} disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Add Badge
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialBadges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <DirectoryBadge
                      badge={{
                        name: badge.name,
                        description: badge.description,
                        color: normalizeDirectoryBadgeColor(badge.color),
                        icon: normalizeDirectoryBadgeIcon(badge.icon),
                      }}
                    />
                  </TableCell>
                  <TableCell className="max-w-[420px] text-sm text-muted-foreground">
                    {badge.description}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {badge.is_active ? (
                      <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isPending}
                      onClick={() => openEditDialog(badge)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      disabled={isPending}
                      onClick={() => {
                        setBadgeToDelete(badge)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {badges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                    No badges configured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBadge ? "Edit badge" : "Create badge"}</DialogTitle>
            <DialogDescription>
              Badge descriptions are shown when users hover over the badge.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="badge-name">Name</Label>
              <Input
                id="badge-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Badge name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="badge-description">Description</Label>
              <Textarea
                id="badge-description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Shown on hover"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="badge-color">Color</Label>
                <Select
                  value={form.color}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, color: value }))}
                >
                  <SelectTrigger id="badge-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIRECTORY_BADGE_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="badge-icon">Icon</Label>
                <Select
                  value={form.icon}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger id="badge-icon">
                    <span className="inline-flex items-center gap-2">
                      <SelectedIcon className="h-4 w-4" />
                      {formatIconLabel(form.icon)}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(([iconKey, Icon]) => (
                      <SelectItem key={iconKey} value={iconKey}>
                        <span className="inline-flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {formatIconLabel(iconKey)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1 flex items-center gap-2">
              <Switch
                id="badge-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="badge-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {editingBadge ? "Save badge" : "Create badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete badge?"
        description="This badge will be removed from all assigned providers."
        itemName={badgeToDelete?.name}
        variant="delete"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
