"use client"

import { useState, useTransition } from "react"
import { Baby, Edit2, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { createAgeGroup, deleteAgeGroup, updateAgeGroup } from "./actions"

type AgeGroupRecord = {
  id: string
  tag: string
  age_range: string
  sort_order: number
  is_active: boolean
}

type Props = {
  initialAgeGroups: AgeGroupRecord[]
}

type FormState = {
  ageRange: string
  sortOrder: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  ageRange: "",
  sortOrder: "",
  isActive: true,
}

export function AdminAgeGroupsPageClient({ initialAgeGroups }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AgeGroupRecord | null>(null)
  const [itemToDelete, setItemToDelete] = useState<AgeGroupRecord | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const nextSortOrder = Math.max(0, ...initialAgeGroups.map((item) => item.sort_order)) + 1

  const openCreateDialog = () => {
    setEditingItem(null)
    setForm({
      ...EMPTY_FORM,
      sortOrder: String(nextSortOrder),
    })
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: AgeGroupRecord) => {
    setEditingItem(item)
    setForm({
      ageRange: item.age_range,
      sortOrder: String(item.sort_order),
      isActive: item.is_active,
    })
    setError(null)
    setDialogOpen(true)
  }

  const handleSave = () => {
    const ageRange = form.ageRange.trim()
    if (!ageRange) {
      setError("Age range is required.")
      return
    }
    const sortOrderValue = form.sortOrder.trim()
    const resolvedSortOrder =
      sortOrderValue === ""
        ? editingItem?.sort_order ?? nextSortOrder
        : Number(sortOrderValue)
    if (!Number.isInteger(resolvedSortOrder) || resolvedSortOrder < 0) {
      setError("Sort order must be a whole number.")
      return
    }

    startTransition(async () => {
      try {
        if (editingItem) {
          await updateAgeGroup(editingItem.id, {
            ageRange,
            sortOrder: resolvedSortOrder,
            isActive: form.isActive,
          })
        } else {
          await createAgeGroup({
            ageRange,
            sortOrder: resolvedSortOrder,
            isActive: form.isActive,
          })
        }
        setDialogOpen(false)
        toast({
          title: editingItem ? "Age range updated." : "Age range added.",
          variant: "success",
        })
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save age range.")
      }
    })
  }

  const handleDeleteClick = (item: AgeGroupRecord) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    setError(null)
    try {
      await deleteAgeGroup(itemToDelete.id)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      toast({ title: "Age range removed.", variant: "success" })
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete age range."
      setError(message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Baby className="h-6 w-6" />
          Age Groups
        </h1>
        <p className="text-muted-foreground">
          Manage available age ranges used in listings and filters.
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
            <CardTitle>Age Groups</CardTitle>
            <CardDescription>Configure age ranges shown across provider listings.</CardDescription>
          </div>
          <Button size="sm" onClick={openCreateDialog} disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Add Age Group
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Age range</TableHead>
                <TableHead className="hidden md:table-cell">Tag</TableHead>
                <TableHead className="hidden md:table-cell">Active</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialAgeGroups.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.sort_order}</TableCell>
                  <TableCell>{item.age_range}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{item.tag}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.is_active ? (
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
                      onClick={() => openEditDialog(item)}
                      disabled={isPending}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteClick(item)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {initialAgeGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">
                    No age groups configured yet. Add your first age range to get started.
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
            <DialogTitle>{editingItem ? "Edit age group" : "Add age group"}</DialogTitle>
            <DialogDescription>
              Configure age ranges shown across provider listings and filters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="age-range">Age range</Label>
              <Input
                id="age-range"
                value={form.ageRange}
                onChange={(event) => setForm((prev) => ({ ...prev, ageRange: event.target.value }))}
                placeholder="0-12 months"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="age-sort-order">Sort order</Label>
              <Input
                id="age-sort-order"
                type="number"
                min={0}
                step={1}
                value={form.sortOrder}
                onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
            </div>
            <div className="space-y-1 flex items-center gap-2">
              <Switch
                id="age-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="age-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {editingItem ? "Save changes" : "Create age group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete age group?"
        description="This will remove it from the list."
        itemName={itemToDelete?.age_range}
        variant="delete"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
