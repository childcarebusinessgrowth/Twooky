"use client"

import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BadgePercent, Gift, Pencil, Plus, Tag, Trash2, X } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { SponsorDiscountRow } from "./page"
import {
  createSponsorDiscount,
  deleteSponsorDiscount,
  updateSponsorDiscount,
  uploadSponsorImage,
  type SponsorDiscountInput,
} from "../actions"

type FormState = {
  title: string
  description: string
  imageUrl: string
  discountCode: string
  externalLink: string
  category: string
  offerBadge: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  imageUrl: "",
  discountCode: "",
  externalLink: "",
  category: "",
  offerBadge: "",
  isActive: true,
}

function rowToForm(row: SponsorDiscountRow): FormState {
  return {
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    discountCode: row.discount_code ?? "",
    externalLink: row.external_link ?? "",
    category: row.category,
    offerBadge: row.offer_badge ?? "",
    isActive: row.is_active,
  }
}

function formToInput(form: FormState): SponsorDiscountInput {
  return {
    title: form.title,
    description: form.description,
    imageUrl: form.imageUrl,
    discountCode: form.discountCode.trim() || null,
    externalLink: form.externalLink.trim() || null,
    category: form.category,
    offerBadge: form.offerBadge.trim() || null,
    isActive: form.isActive,
  }
}

type Props = {
  initialRows: SponsorDiscountRow[]
}

export function AdminSponsorDiscountsClient({ initialRows }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SponsorDiscountRow | null>(null)

  const rows = initialRows

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setPendingFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setDialogOpen(true)
  }

  const openEdit = (row: SponsorDiscountRow) => {
    setEditingId(row.id)
    setForm(rowToForm(row))
    setPendingFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setDialogOpen(true)
  }

  const onPickFile = (file: File | null) => {
    setPendingFile(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const removeImage = () => {
    const hadPending = pendingFile != null || previewUrl != null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPendingFile(null)
    const el = document.getElementById("admin-sponsor-discount-image") as HTMLInputElement | null
    if (el) el.value = ""
    if (hadPending) return
    setForm((f) => ({ ...f, imageUrl: "" }))
  }

  const displayImageSrc = useMemo(() => {
    if (previewUrl) return previewUrl
    if (form.imageUrl) return form.imageUrl
    return null
  }, [previewUrl, form.imageUrl])

  const save = () => {
    startTransition(async () => {
      try {
        let imageUrl = form.imageUrl.trim()
        if (pendingFile) {
          const up = await uploadSponsorImage(pendingFile)
          imageUrl = up.publicUrl
        }
        if (!imageUrl) {
          toast({ title: "Image required", description: "Upload an image or keep the existing one.", variant: "destructive" })
          return
        }
        const input = formToInput({ ...form, imageUrl })
        if (editingId) {
          await updateSponsorDiscount(editingId, input)
          toast({ title: "Discount updated" })
        } else {
          await createSponsorDiscount(input)
          toast({ title: "Discount created" })
        }
        setDialogOpen(false)
        router.refresh()
      } catch (e) {
        toast({
          title: "Could not save",
          description: e instanceof Error ? e.message : "Something went wrong.",
          variant: "destructive",
        })
      }
    })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteSponsorDiscount(deleteTarget.id)
        toast({ title: "Discount removed" })
        setDeleteOpen(false)
        setDeleteTarget(null)
        router.refresh()
      } catch (e) {
        toast({
          title: "Could not delete",
          description: e instanceof Error ? e.message : "Something went wrong.",
          variant: "destructive",
        })
      }
    })
  }

  const toggleActive = (row: SponsorDiscountRow, next: boolean) => {
    startTransition(async () => {
      try {
        await updateSponsorDiscount(row.id, {
          title: row.title,
          description: row.description,
          imageUrl: row.image_url,
          discountCode: row.discount_code,
          externalLink: row.external_link,
          category: row.category,
          offerBadge: row.offer_badge,
          isActive: next,
        })
        toast({ title: next ? "Activated" : "Deactivated" })
        router.refresh()
      } catch (e) {
        toast({
          title: "Update failed",
          description: e instanceof Error ? e.message : "Something went wrong.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Gift className="h-8 w-8" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Discounts</h1>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Sponsor discount codes and offers. Active entries can be surfaced on the public site when you add parent-facing pages.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add discount
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BadgePercent className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No discounts yet</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Create your first sponsored discount with a title, image, and category. Optional codes and links help parents redeem offers.
            </p>
            <Button className="mt-6 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add discount
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <Card
              key={row.id}
              className={cn(
                "group overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md",
                !row.is_active && "opacity-90",
              )}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                <Image
                  src={row.image_url}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {row.offer_badge && (
                      <Badge className="border-0 bg-amber-500 text-amber-950 hover:bg-amber-500 font-semibold">
                        {row.offer_badge}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-white/95 text-foreground backdrop-blur-sm">
                      <Tag className="mr-1 h-3 w-3" />
                      {row.category}
                    </Badge>
                    <Badge
                      variant={row.is_active ? "default" : "outline"}
                      className={cn(!row.is_active && "border-white/40 bg-black/30 text-white")}
                    >
                      {row.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="line-clamp-2 text-base leading-snug">{row.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-sm">{row.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {row.discount_code && (
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-foreground">{row.discount_code}</span>
                  )}
                  {row.external_link && (
                    <span className="truncate rounded-md bg-muted/80 px-2 py-0.5" title={row.external_link}>
                      Link set
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={row.is_active}
                      onCheckedChange={(v) => toggleActive(row, v)}
                      disabled={isPending}
                      aria-label="Active"
                    />
                    <span className="text-xs text-muted-foreground">Visible when active</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteTarget(row)
                        setDeleteOpen(true)
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit discount" : "New discount"}</DialogTitle>
            <DialogDescription>
              Required fields are marked. Codes and external links are optional for flexible campaigns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sd-title">Title</Label>
              <Input
                id="sd-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Back-to-school bundle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd-desc">Description</Label>
              <Textarea
                id="sd-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="What parents get and any terms…"
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              {displayImageSrc && (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full max-w-full overflow-hidden rounded-lg border bg-muted">
                    <Image src={displayImageSrc} alt="" fill className="object-cover" sizes="500px" unoptimized={displayImageSrc.startsWith("blob:")} />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                    {pendingFile || previewUrl ? "Remove selected file" : "Remove image"}
                  </Button>
                </div>
              )}
              <Input
                id="admin-sponsor-discount-image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP, or GIF up to 5MB.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sd-code">Discount code (optional)</Label>
                <Input
                  id="sd-code"
                  value={form.discountCode}
                  onChange={(e) => setForm((f) => ({ ...f, discountCode: e.target.value }))}
                  placeholder="PROMO2026"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sd-link">External link (optional)</Label>
                <Input
                  id="sd-link"
                  type="url"
                  value={form.externalLink}
                  onChange={(e) => setForm((f) => ({ ...f, externalLink: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd-cat">Category</Label>
              <Input
                id="sd-cat"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Supplies, Classes, Membership"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sd-offer-badge">Offer badge (optional)</Label>
              <Input
                id="sd-offer-badge"
                value={form.offerBadge}
                onChange={(e) => setForm((f) => ({ ...f, offerBadge: e.target.value }))}
                placeholder='e.g. 20% OFF — shown on parent Discounts cards'
              />
              <p className="text-xs text-muted-foreground">Short promo line on the parent dashboard discount card.</p>
            </div>
            <div className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="sd-active" className="cursor-pointer">
                Active
              </Label>
              <Switch
                id="sd-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={isPending}>
              {editingId ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this discount?"
        description="This removes the sponsor discount from the directory. You can add it again later."
        itemName={deleteTarget?.title}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
