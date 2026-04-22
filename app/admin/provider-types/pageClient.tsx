"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Tags, Edit2, Plus, Trash2 } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { dispatchProviderTaxonomyRefresh } from "@/lib/provider-taxonomy-client"
import {
  createProviderType,
  createProviderTypeCategory,
  deleteProviderType,
  deleteProviderTypeCategory,
  updateProviderType,
  updateProviderTypeCategory,
  type ProviderTypeCategoryRecord,
} from "./actions"
import type { ProviderTypeRecord } from "@/lib/provider-taxonomy"

type Props = {
  initialCategories: ProviderTypeCategoryRecord[]
  initialProviderTypes: ProviderTypeRecord[]
}

type CategoryFormState = {
  name: string
  isActive: boolean
}

type ProviderTypeFormState = {
  name: string
  slug: string
  categoryId: string
  isActive: boolean
}

const emptyCategoryForm: CategoryFormState = {
  name: "",
  isActive: true,
}

const emptyProviderTypeForm: ProviderTypeFormState = {
  name: "",
  slug: "",
  categoryId: "",
  isActive: true,
}

export function AdminProviderTypesPageClient({ initialCategories, initialProviderTypes }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"categories" | "types">("categories")

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [providerTypeDialogOpen, setProviderTypeDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "category"; item: ProviderTypeCategoryRecord }
    | { kind: "type"; item: ProviderTypeRecord }
    | null
  >(null)
  const [editingCategory, setEditingCategory] = useState<ProviderTypeCategoryRecord | null>(null)
  const [editingProviderType, setEditingProviderType] = useState<ProviderTypeRecord | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm)
  const [providerTypeForm, setProviderTypeForm] = useState<ProviderTypeFormState>(emptyProviderTypeForm)

  const categories = initialCategories
  const providerTypes = initialProviderTypes

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category] as const)),
    [categories],
  )

  const providerTypesByCategory = useMemo(() => {
    const result = new Map<string, ProviderTypeRecord[]>()
    for (const item of providerTypes) {
      const current = result.get(item.category_id) ?? []
      current.push(item)
      result.set(item.category_id, current)
    }
    return result
  }, [providerTypes])

  const openCreateCategory = () => {
    setEditingCategory(null)
    setCategoryForm(emptyCategoryForm)
    setError(null)
    setCategoryDialogOpen(true)
  }

  const openEditCategory = (category: ProviderTypeCategoryRecord) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      isActive: category.is_active,
    })
    setError(null)
    setCategoryDialogOpen(true)
  }

  const openCreateProviderType = () => {
    setEditingProviderType(null)
    setProviderTypeForm({
      ...emptyProviderTypeForm,
      categoryId: categories[0]?.id ?? "",
    })
    setError(null)
    setProviderTypeDialogOpen(true)
  }

  const openEditProviderType = (item: ProviderTypeRecord) => {
    setEditingProviderType(item)
    setProviderTypeForm({
      name: item.name,
      slug: item.slug,
      categoryId: item.category_id,
      isActive: true,
    })
    setError(null)
    setProviderTypeDialogOpen(true)
  }

  const submitCategory = () => {
    if (!categoryForm.name.trim()) {
      setError("Category name is required.")
      return
    }

    startTransition(async () => {
      try {
        if (editingCategory) {
          await updateProviderTypeCategory(editingCategory.id, categoryForm)
          toast({ title: "Category updated.", variant: "success" })
        } else {
          await createProviderTypeCategory(categoryForm)
          toast({ title: "Category added.", variant: "success" })
        }
        setCategoryDialogOpen(false)
        setError(null)
        router.refresh()
        dispatchProviderTaxonomyRefresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save category.")
      }
    })
  }

  const submitProviderType = () => {
    if (!providerTypeForm.name.trim()) {
      setError("Provider type name is required.")
      return
    }
    if (!providerTypeForm.categoryId) {
      setError("Choose a category for this provider type.")
      return
    }

    startTransition(async () => {
      try {
        if (editingProviderType) {
          await updateProviderType(editingProviderType.id, providerTypeForm)
          toast({ title: "Provider type updated.", variant: "success" })
        } else {
          await createProviderType(providerTypeForm)
          toast({ title: "Provider type added.", variant: "success" })
        }
        setProviderTypeDialogOpen(false)
        setError(null)
        router.refresh()
        dispatchProviderTaxonomyRefresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save provider type.")
      }
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setError(null)
    try {
      if (deleteTarget.kind === "category") {
        await deleteProviderTypeCategory(deleteTarget.item.id)
        toast({ title: "Category removed.", variant: "success" })
      } else {
        await deleteProviderType(deleteTarget.item.id)
        toast({ title: "Provider type removed.", variant: "success" })
      }
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      router.refresh()
      dispatchProviderTaxonomyRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Provider taxonomy
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage the top-level categories shown in Explore and the provider types grouped underneath them.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "categories" | "types")}>
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="types">Provider types</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Top-level groups that appear in the Explore dropdown.</CardDescription>
              </div>
              <Button size="sm" onClick={openCreateCategory} disabled={isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add category
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Active</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {category.is_active ? "Active" : "Inactive"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditCategory(category)}
                          disabled={isPending}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setDeleteTarget({ kind: "category", item: category })
                            setDeleteDialogOpen(true)
                          }}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        No provider categories yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Provider types</CardTitle>
                <CardDescription>Choose a category, then add the provider type shown in forms and menus.</CardDescription>
              </div>
              <Button size="sm" onClick={openCreateProviderType} disabled={isPending || categories.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add provider type
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Slug</TableHead>
                    <TableHead className="hidden md:table-cell">Active</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providerTypes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{categoriesById.get(item.category_id)?.name ?? item.category_name}</TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{item.slug}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.is_active ? "Active" : "Inactive"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditProviderType(item)}
                          disabled={isPending}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            setDeleteTarget({ kind: "type", item })
                            setDeleteDialogOpen(true)
                          }}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {providerTypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        No provider types yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>Categories group provider types in the Explore menu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Providers"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="category-active"
                checked={categoryForm.isActive}
                onCheckedChange={(checked) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    isActive: checked,
                  }))
                }
              />
              <Label htmlFor="category-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={submitCategory} disabled={isPending}>
              {editingCategory ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={providerTypeDialogOpen} onOpenChange={setProviderTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProviderType ? "Edit provider type" : "Add provider type"}</DialogTitle>
            <DialogDescription>Provider types are shown in the menu and provider forms.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="type-name">Name</Label>
              <Input
                id="type-name"
                value={providerTypeForm.name}
                onChange={(e) => setProviderTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nurseries"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="type-category">Category</Label>
              <Select
                value={providerTypeForm.categoryId}
                onValueChange={(value) => setProviderTypeForm((prev) => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger id="type-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="type-slug">Slug</Label>
              <Input
                id="type-slug"
                value={providerTypeForm.slug}
                onChange={(e) => setProviderTypeForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="nurseries"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="type-active"
                checked={providerTypeForm.isActive}
                onCheckedChange={(checked) =>
                  setProviderTypeForm((prev) => ({
                    ...prev,
                    isActive: checked,
                  }))
                }
              />
              <Label htmlFor="type-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderTypeDialogOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={submitProviderType} disabled={isPending || categories.length === 0}>
              {editingProviderType ? "Save changes" : "Create provider type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) setDeleteTarget(null)
          }}
          title={deleteTarget.kind === "category" ? "Delete category?" : "Delete provider type?"}
          description={
            deleteTarget.kind === "category"
              ? "This category will be removed if no provider types are assigned to it."
              : "This will remove the provider type from menus and forms."
          }
          itemName={deleteTarget.item.name}
          variant="delete"
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}

