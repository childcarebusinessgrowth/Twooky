"use client"

import { useMemo, useState, useTransition } from "react"
import type { LucideIcon } from "lucide-react"
import { Edit2, Plus, Trash2 } from "lucide-react"
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

export type CatalogItem = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  secondary_value?: string | null
}

type MutationInput = {
  name: string
  isActive: boolean
  secondaryValue?: string | null
}

type SecondaryFieldConfig = {
  tableHeader: string
  formLabel: string
  placeholder?: string
}

type CatalogManagerProps = {
  icon: LucideIcon
  pageTitle: string
  pageDescription: string
  cardTitle: string
  cardDescription: string
  singularLabel: string
  addButtonLabel: string
  emptyStateMessage: string
  initialItems: CatalogItem[]
  createItem: (input: MutationInput) => Promise<void>
  updateItem: (id: string, input: MutationInput) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  secondaryField?: SecondaryFieldConfig
}

type FormState = {
  name: string
  isActive: boolean
  secondaryValue: string
}

const EMPTY_FORM: FormState = {
  name: "",
  isActive: true,
  secondaryValue: "",
}

export function CatalogManager({
  icon: Icon,
  pageTitle,
  pageDescription,
  cardTitle,
  cardDescription,
  singularLabel,
  addButtonLabel,
  emptyStateMessage,
  initialItems,
  createItem,
  updateItem,
  deleteItem,
  secondaryField,
}: CatalogManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const capitalizedLabel = singularLabel[0].toUpperCase() + singularLabel.slice(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const items = useMemo(() => initialItems, [initialItems])
  const hasSecondaryField = Boolean(secondaryField)
  const displaySecondaryHeader = secondaryField?.tableHeader ?? "Details"

  const openCreateDialog = () => {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: CatalogItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      isActive: item.is_active,
      secondaryValue: item.secondary_value ?? "",
    })
    setError(null)
    setDialogOpen(true)
  }

  const runAction = (action: () => Promise<void>, successMessage?: string) => {
    setError(null)
    startTransition(async () => {
      try {
        await action()
        setDialogOpen(false)
        if (successMessage) {
          toast({ title: successMessage, variant: "success" })
        }
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to save ${singularLabel}.`
        setError(message)
      }
    })
  }

  const handleSave = () => {
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      setError(`${singularLabel[0].toUpperCase()}${singularLabel.slice(1)} name is required.`)
      return
    }

    const payload: MutationInput = {
      name: trimmedName,
      isActive: form.isActive,
      secondaryValue: hasSecondaryField ? form.secondaryValue.trim() || null : null,
    }

    runAction(
      async () => {
        if (editingItem) {
          await updateItem(editingItem.id, payload)
        } else {
          await createItem(payload)
        }
      },
      editingItem ? `${capitalizedLabel} updated.` : `${capitalizedLabel} added.`
    )
  }

  const handleDeleteClick = (item: CatalogItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    setError(null)
    try {
      await deleteItem(itemToDelete.id)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      toast({ title: `${capitalizedLabel} removed.`, variant: "success" })
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to delete ${singularLabel}.`
      setError(message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon className="h-6 w-6" />
          {pageTitle}
        </h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </div>
          <Button size="sm" onClick={openCreateDialog} disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {hasSecondaryField && <TableHead>{displaySecondaryHeader}</TableHead>}
                <TableHead className="hidden md:table-cell">Active</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  {hasSecondaryField && <TableCell>{item.secondary_value ?? ","}</TableCell>}
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
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={hasSecondaryField ? 4 : 3} className="text-center text-muted-foreground text-sm">
                    {emptyStateMessage}
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
            <DialogTitle>{editingItem ? `Edit ${singularLabel}` : `Add ${singularLabel}`}</DialogTitle>
            <DialogDescription>
              Manage the {singularLabel} values shown across provider listings and filters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="catalog-name">Name</Label>
              <Input
                id="catalog-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={`Enter ${singularLabel} name`}
              />
            </div>

            {secondaryField && (
              <div className="space-y-1">
                <Label htmlFor="catalog-secondary">{secondaryField.formLabel}</Label>
                <Input
                  id="catalog-secondary"
                  value={form.secondaryValue}
                  onChange={(event) => setForm((prev) => ({ ...prev, secondaryValue: event.target.value }))}
                  placeholder={secondaryField.placeholder}
                />
              </div>
            )}

            <div className="space-y-1 flex items-center gap-2">
                <Switch
                  id="catalog-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => {
                    setForm((prev) => ({
                      ...prev,
                      isActive: checked,
                    }))
                  }}
                />
                <Label htmlFor="catalog-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {editingItem ? `Save ${singularLabel}` : `Create ${singularLabel}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${singularLabel}?`}
        description="This will remove it from the list."
        itemName={itemToDelete?.name}
        variant="delete"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
