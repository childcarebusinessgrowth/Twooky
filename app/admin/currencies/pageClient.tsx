"use client"

import { useMemo, useState, useTransition } from "react"
import { DollarSign, Plus, Edit2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { createCurrency, updateCurrency, deleteCurrency } from "./actions"

type CurrencyRecord = {
  id: string
  code: string
  name: string
  symbol: string
  sort_order: number
  is_active: boolean
}

type Props = {
  initialCurrencies: CurrencyRecord[]
}

type FormState = {
  code: string
  name: string
  symbol: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  code: "",
  name: "",
  symbol: "",
  isActive: true,
}

export function AdminCurrenciesPageClient({ initialCurrencies }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CurrencyRecord | null>(null)
  const [itemToDelete, setItemToDelete] = useState<CurrencyRecord | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const items = useMemo(() => initialCurrencies, [initialCurrencies])

  const openCreateDialog = () => {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: CurrencyRecord) => {
    setEditingItem(item)
    setForm({
      code: item.code,
      name: item.name,
      symbol: item.symbol,
      isActive: item.is_active,
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
        const message = err instanceof Error ? err.message : "Failed to save currency."
        setError(message)
      }
    })
  }

  const handleSave = () => {
    const code = form.code.trim().toUpperCase()
    const name = form.name.trim()
    const symbol = form.symbol.trim()

    if (!code) {
      setError("Currency code is required.")
      return
    }
    if (!name) {
      setError("Currency name is required.")
      return
    }
    if (!symbol) {
      setError("Currency symbol is required.")
      return
    }

    const payload = {
      code,
      name,
      symbol,
      isActive: form.isActive,
    }

    runAction(
      async () => {
        if (editingItem) {
          await updateCurrency(editingItem.id, payload)
        } else {
          await createCurrency(payload)
        }
      },
      editingItem ? "Currency updated." : "Currency added."
    )
  }

  const handleDeleteClick = (item: CurrencyRecord) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    setError(null)
    try {
      await deleteCurrency(itemToDelete.id)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      toast({ title: "Currency removed.", variant: "success" })
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete currency."
      setError(message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Currencies
        </h1>
        <p className="text-muted-foreground">
          Manage currencies used for provider tuition display. Providers choose a currency when adding their listing.
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
            <CardTitle>Currencies</CardTitle>
            <CardDescription>Add or edit currencies for tuition display.</CardDescription>
          </div>
          <Button size="sm" onClick={openCreateDialog} disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Add Currency
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead className="hidden md:table-cell">Active</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="font-medium">{item.symbol}</TableCell>
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">
                    No currencies configured yet. Add your first currency to get started.
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
            <DialogTitle>{editingItem ? "Edit Currency" : "Add Currency"}</DialogTitle>
            <DialogDescription>
              Manage currency values shown for provider tuition (e.g. USD, GBP).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="currency-code">Code</Label>
              <Input
                id="currency-code"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="USD"
                maxLength={10}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency-name">Name</Label>
              <Input
                id="currency-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="US Dollar"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="currency-symbol">Symbol</Label>
              <Input
                id="currency-symbol"
                value={form.symbol}
                onChange={(e) => setForm((prev) => ({ ...prev, symbol: e.target.value }))}
                placeholder="$"
                maxLength={5}
              />
            </div>
            <div className="space-y-1 flex items-center gap-2">
                <Switch
                  id="currency-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor="currency-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {editingItem ? "Save Currency" : "Create Currency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete currency?"
        description="This will remove it from the list. Providers using this currency will show no symbol."
        itemName={itemToDelete?.name}
        variant="delete"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
