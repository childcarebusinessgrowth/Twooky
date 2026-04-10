"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Building2, Check, ChevronsUpDown, MapPin, Pencil, Plus, Tag, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { AgeGroupOption, LocalServiceDealRow } from "./page"
import {
  createLocalServiceDeal,
  deleteLocalServiceDeal,
  searchProviders,
  updateLocalServiceDeal,
  uploadSponsorImage,
  type LocalServiceDealInput,
  type ProviderSearchRow,
} from "../actions"

function parseAgeTargetToIds(ageTarget: string, groups: AgeGroupOption[]): string[] {
  if (!ageTarget.trim() || groups.length === 0) return []
  const byLowerName = new Map(groups.map((g) => [g.name.trim().toLowerCase(), g.id]))
  const segments = ageTarget
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const ids: string[] = []
  const seen = new Set<string>()
  for (const seg of segments) {
    const id = byLowerName.get(seg.toLowerCase())
    if (id && !seen.has(id)) {
      seen.add(id)
      ids.push(id)
    }
  }
  return ids
}

function buildAgeTargetFromSelection(selectedIds: Set<string>, groups: AgeGroupOption[]): string {
  return groups.filter((g) => selectedIds.has(g.id)).map((g) => g.name).join(", ")
}

type FormState = {
  title: string
  description: string
  imageUrl: string
  providerId: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  imageUrl: "",
  providerId: "",
  isActive: true,
}

function rowToForm(row: LocalServiceDealRow): FormState {
  return {
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    providerId: row.provider_id,
    isActive: row.is_active,
  }
}

function formToInput(form: FormState, ageTarget: string): LocalServiceDealInput {
  return {
    title: form.title,
    description: form.description,
    imageUrl: form.imageUrl,
    ageTarget,
    providerId: form.providerId,
    isActive: form.isActive,
  }
}

type Props = {
  initialRows: LocalServiceDealRow[]
  providerMap: Record<string, { business_name: string | null; city: string | null }>
  ageGroups: AgeGroupOption[]
}

export function AdminLocalServicesClient({ initialRows, providerMap, ageGroups }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LocalServiceDealRow | null>(null)
  const [selectedAgeGroupIds, setSelectedAgeGroupIds] = useState<Set<string>>(new Set())
  const [ageGroupSelectOpen, setAgeGroupSelectOpen] = useState(false)

  const [providerOpen, setProviderOpen] = useState(false)
  const [providerQuery, setProviderQuery] = useState("")
  const [providerResults, setProviderResults] = useState<ProviderSearchRow[]>([])

  const rows = initialRows

  useEffect(() => {
    const q = providerQuery.trim()
    const handle = window.setTimeout(() => {
      void searchProviders(q)
        .then(setProviderResults)
        .catch((e) => {
          console.error(e)
          setProviderResults([])
        })
    }, 280)
    return () => window.clearTimeout(handle)
  }, [providerQuery])

  useEffect(() => {
    if (providerOpen) {
      setProviderQuery("")
      void searchProviders("").then(setProviderResults).catch(() => setProviderResults([]))
    }
  }, [providerOpen])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setSelectedAgeGroupIds(new Set())
    setPendingFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setDialogOpen(true)
  }

  const openEdit = (row: LocalServiceDealRow) => {
    setEditingId(row.id)
    setForm(rowToForm(row))
    setSelectedAgeGroupIds(new Set(parseAgeTargetToIds(row.age_target, ageGroups)))
    setPendingFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setDialogOpen(true)
  }

  const toggleAgeGroup = (id: string, checked: boolean) => {
    setSelectedAgeGroupIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
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
    const el = document.getElementById("admin-sponsor-local-image") as HTMLInputElement | null
    if (el) el.value = ""
    if (hadPending) return
    setForm((f) => ({ ...f, imageUrl: "" }))
  }

  const displayImageSrc = useMemo(() => {
    if (previewUrl) return previewUrl
    if (form.imageUrl) return form.imageUrl
    return null
  }, [previewUrl, form.imageUrl])

  const ageTargetSummary = useMemo(() => {
    const s = buildAgeTargetFromSelection(selectedAgeGroupIds, ageGroups)
    if (!s) return ""
    if (s.length > 72) return `${selectedAgeGroupIds.size} age groups selected`
    return s
  }, [selectedAgeGroupIds, ageGroups])

  const selectedProviderLabel = useMemo(() => {
    if (!form.providerId) return null
    const fromMap = providerMap[form.providerId]
    if (fromMap?.business_name) return fromMap.business_name
    const fromSearch = providerResults.find((p) => p.profile_id === form.providerId)
    if (fromSearch?.business_name) return fromSearch.business_name
    return form.providerId.slice(0, 8) + "…"
  }, [form.providerId, providerMap, providerResults])

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
        const ageTarget = buildAgeTargetFromSelection(selectedAgeGroupIds, ageGroups).trim()
        if (!ageTarget) {
          toast({
            title: "Age target required",
            description: "Select at least one age group from the directory.",
            variant: "destructive",
          })
          return
        }
        const input = formToInput({ ...form, imageUrl }, ageTarget)
        if (editingId) {
          await updateLocalServiceDeal(editingId, input)
          toast({ title: "Deal updated" })
        } else {
          await createLocalServiceDeal(input)
          toast({ title: "Deal created" })
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
        await deleteLocalServiceDeal(deleteTarget.id)
        toast({ title: "Deal removed" })
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

  const toggleActive = (row: LocalServiceDealRow, next: boolean) => {
    startTransition(async () => {
      try {
        await updateLocalServiceDeal(row.id, {
          title: row.title,
          description: row.description,
          imageUrl: row.image_url,
          ageTarget: row.age_target,
          providerId: row.provider_id,
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
            <Tag className="h-8 w-8" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Local Services & Deals</h1>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Highlight nearby services and partner offers. Link each entry to a provider and make the age target clear for parents.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add deal
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Tag className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No local deals yet</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Add a deal tied to a provider; location comes from their listing. Set age target for parents. Active entries can be shown on the site when you publish them.
            </p>
            <Button className="mt-6 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add deal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const prov = providerMap[row.provider_id]
            const providerLabel = prov?.business_name ?? "Provider"
            return (
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
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-12">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="max-w-full truncate bg-white/95 text-foreground backdrop-blur-sm">
                        <Building2 className="mr-1 h-3 w-3 shrink-0" />
                        {providerLabel}
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
                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                      Age target
                    </p>
                    <p className="mt-0.5 font-medium text-foreground">{row.age_target}</p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{prov?.city?.trim() || row.location || "—"}</span>
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
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(90vh,860px)] w-full max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit local deal" : "New local deal"}</DialogTitle>
            <DialogDescription>
              Tie each deal to a provider; location is taken from their listing. Describe who it is for with age target.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={providerOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">{selectedProviderLabel ?? "Search providers…"}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Search by name or city…" value={providerQuery} onValueChange={setProviderQuery} />
                    <CommandList>
                      <CommandEmpty>No provider found.</CommandEmpty>
                      <CommandGroup>
                        {providerResults.map((p) => (
                          <CommandItem
                            key={p.profile_id}
                            value={`${p.profile_id}-${p.business_name ?? ""}`}
                            onSelect={() => {
                              setForm((f) => ({ ...f, providerId: p.profile_id }))
                              setProviderOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.providerId === p.profile_id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">{p.business_name ?? "Unnamed"}</span>
                              {p.city && <span className="truncate text-xs text-muted-foreground">{p.city}</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Location stored for this deal is copied from the provider profile (city and address on file).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ls-title">Title</Label>
              <Input
                id="ls-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Saturday music circle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ls-desc">Description</Label>
              <Textarea
                id="ls-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              {displayImageSrc && (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
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
                id="admin-sponsor-local-image"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP, or GIF up to 5MB.</p>
            </div>

            <div className="space-y-3 rounded-xl border-2 border-amber-500/35 bg-amber-500/5 p-4 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/20">
              <div>
                <Label className="text-base font-semibold text-foreground">Age target</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open the list and check every age group this deal applies to (same options as listings).
                </p>
              </div>
              {ageGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No age groups in the database. Add them under Admin → Directory.</p>
              ) : (
                <Popover open={ageGroupSelectOpen} onOpenChange={setAgeGroupSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={ageGroupSelectOpen}
                      className="h-auto min-h-10 w-full justify-between py-2 text-left font-normal"
                    >
                      <span className={cn("line-clamp-3 break-words", !ageTargetSummary && "text-muted-foreground")}>
                        {ageTargetSummary || "Select age groups…"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <div className="max-h-72 overflow-y-auto overflow-x-hidden p-2">
                      <p className="px-2 pb-2 text-xs text-muted-foreground">Select one or more, then click outside to close.</p>
                      <div className="space-y-0.5">
                        {ageGroups.map((g) => {
                          const checked = selectedAgeGroupIds.has(g.id)
                          return (
                            <div
                              key={g.id}
                              className={cn(
                                "flex items-start gap-2 rounded-md px-2 py-2 transition-colors hover:bg-accent",
                                checked && "bg-accent/50",
                              )}
                            >
                              <Checkbox
                                id={`ls-age-${g.id}`}
                                checked={checked}
                                onCheckedChange={(v) => toggleAgeGroup(g.id, v === true)}
                                className="mt-0.5"
                              />
                              <label htmlFor={`ls-age-${g.id}`} className="min-w-0 flex-1 cursor-pointer">
                                <span className="block text-sm font-medium leading-tight text-foreground">{g.name}</span>
                                {g.age_range ? (
                                  <span className="mt-0.5 block text-xs text-muted-foreground">{g.age_range}</span>
                                ) : null}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="ls-active" className="cursor-pointer">
                Active
              </Label>
              <Switch id="ls-active" checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
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
        title="Delete this deal?"
        description="This removes the local service deal from your catalog."
        itemName={deleteTarget?.title}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
