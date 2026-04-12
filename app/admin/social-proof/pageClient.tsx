"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronsUpDown,
  Copy,
  Megaphone,
  Pencil,
  Plus,
  X,
  Star,
  Trash2,
  Video,
  Image as ImageIcon,
  Type,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  createSocialProof,
  deleteSocialProof,
  searchProviders,
  uploadSocialProofImage,
  uploadSocialProofVideo,
  updateSocialProof,
  type ProviderSearchRow,
  type SocialProofInput,
  type SocialProofType,
} from "./actions"
import type { SocialProofRow } from "./page"

type ProviderMeta = {
  profile_id: string
  provider_slug: string | null
  business_name: string | null
  city: string | null
}

type Props = {
  initialRows: SocialProofRow[]
  providerMap: Record<string, ProviderMeta>
}

type FormState = {
  providerProfileId: string
  type: SocialProofType
  content: string
  rating: string
  imageUrl: string
  videoUrl: string
  authorName: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  providerProfileId: "",
  type: "text",
  content: "",
  rating: "",
  imageUrl: "",
  videoUrl: "",
  authorName: "",
  isActive: true,
}

const typeLabel: Record<SocialProofType, string> = {
  text: "Text",
  image: "Image",
  video: "Video",
}

function rowToForm(row: SocialProofRow): FormState {
  return {
    providerProfileId: row.provider_profile_id,
    type: row.type,
    content: row.content,
    rating: row.rating?.toString() ?? "",
    imageUrl: row.image_url ?? "",
    videoUrl: row.video_url ?? "",
    authorName: row.author_name ?? "",
    isActive: row.is_active,
  }
}

function formToInput(form: FormState): SocialProofInput {
  const parsedRating = Number.parseInt(form.rating, 10)
  return {
    providerProfileId: form.providerProfileId,
    type: form.type,
    content: form.content,
    rating: Number.isNaN(parsedRating) ? null : parsedRating,
    imageUrl: form.imageUrl.trim() || null,
    videoUrl: form.videoUrl.trim() || null,
    authorName: form.authorName.trim() || null,
    isActive: form.isActive,
  }
}

function getTypeIcon(type: SocialProofType) {
  if (type === "image") return ImageIcon
  if (type === "video") return Video
  return Type
}

export function AdminSocialProofClient({ initialRows, providerMap }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [providerOpen, setProviderOpen] = useState(false)
  const [providerQuery, setProviderQuery] = useState("")
  const [providerResults, setProviderResults] = useState<ProviderSearchRow[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SocialProofRow | null>(null)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const q = providerQuery.trim()
    const handle = window.setTimeout(() => {
      void searchProviders(q)
        .then(setProviderResults)
        .catch(() => setProviderResults([]))
    }, 250)
    return () => window.clearTimeout(handle)
  }, [providerQuery])

  const openCreate = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setPendingImageFile(null)
    setPendingVideoFile(null)
    setImagePreviewUrl(null)
    setVideoPreviewUrl(null)
    setDialogOpen(true)
  }

  const openEdit = (row: SocialProofRow) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    setEditingId(row.id)
    setForm(rowToForm(row))
    setPendingImageFile(null)
    setPendingVideoFile(null)
    setImagePreviewUrl(null)
    setVideoPreviewUrl(null)
    setDialogOpen(true)
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    }
  }, [imagePreviewUrl, videoPreviewUrl])

  const selectedProvider = useMemo(() => {
    if (!form.providerProfileId) return null
    return (
      providerMap[form.providerProfileId] ??
      providerResults.find((result) => result.profile_id === form.providerProfileId) ??
      null
    )
  }, [form.providerProfileId, providerMap, providerResults])

  const save = () => {
    startTransition(async () => {
      try {
        let imageUrl = form.imageUrl.trim() || null
        let videoUrl = form.videoUrl.trim() || null

        if (form.type === "image" && pendingImageFile) {
          const uploadedImage = await uploadSocialProofImage(pendingImageFile)
          imageUrl = uploadedImage.publicUrl
        }
        if (form.type === "video" && pendingVideoFile) {
          const uploadedVideo = await uploadSocialProofVideo(pendingVideoFile)
          videoUrl = uploadedVideo.publicUrl
        }
        if (form.type === "image" && !imageUrl) {
          toast({
            title: "Image required",
            description: "Please upload an image for image testimonials.",
            variant: "destructive",
          })
          return
        }
        if (form.type === "video" && !videoUrl) {
          toast({
            title: "Video required",
            description: "Please upload a video for video testimonials.",
            variant: "destructive",
          })
          return
        }

        const input = formToInput({
          ...form,
          imageUrl: form.type === "image" ? imageUrl ?? "" : "",
          videoUrl: form.type === "video" ? videoUrl ?? "" : "",
        })
        if (editingId) {
          await updateSocialProof(editingId, input)
          toast({ title: "Social proof updated" })
        } else {
          await createSocialProof(input)
          toast({ title: "Social proof created" })
        }
        setDialogOpen(false)
        router.refresh()
      } catch (error) {
        toast({
          title: "Could not save social proof",
          description: error instanceof Error ? error.message : "Something went wrong.",
          variant: "destructive",
        })
      }
    })
  }

  const onPickImage = (file: File | null) => {
    setPendingImageFile(file)
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImagePreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const onPickVideo = (file: File | null) => {
    setPendingVideoFile(file)
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    setVideoPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const removeImageSelection = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImagePreviewUrl(null)
    setPendingImageFile(null)
    const input = document.getElementById("sp-image-file") as HTMLInputElement | null
    if (input) input.value = ""
  }

  const removeVideoSelection = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    setVideoPreviewUrl(null)
    setPendingVideoFile(null)
    const input = document.getElementById("sp-video-file") as HTMLInputElement | null
    if (input) input.value = ""
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      try {
        await deleteSocialProof(deleteTarget.id)
        toast({ title: "Social proof deleted" })
        setDeleteOpen(false)
        setDeleteTarget(null)
        router.refresh()
      } catch (error) {
        toast({
          title: "Could not delete social proof",
          description: error instanceof Error ? error.message : "Something went wrong.",
          variant: "destructive",
        })
      }
    })
  }

  const copyEmbedSnippet = async (providerSlug: string | null, providerProfileId: string) => {
    if (!providerSlug && !providerProfileId) {
      toast({
        title: "Provider reference required",
        description: "This provider is missing both slug and profile id.",
        variant: "destructive",
      })
      return
    }

    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://twooki.com"
    const identifier = providerProfileId || providerSlug
    const snippet = `<script src="${origin}/widget/social-proof.js" data-provider-id="${identifier}"></script>`

    try {
      await navigator.clipboard.writeText(snippet)
      toast({ title: "Embed snippet copied" })
    } catch {
      toast({
        title: "Could not copy",
        description: "Copy failed. Try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Megaphone className="h-8 w-8" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Social Proof</h1>
          </div>
          <p className="max-w-3xl text-muted-foreground">
            Create and manage testimonials shown on provider websites and Twooki provider profiles. Only admin users can publish this content.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add social proof
        </Button>
      </div>

      {initialRows.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Megaphone className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No social proof items yet</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Add text, image, or video testimonials and assign them to a provider.
            </p>
            <Button className="mt-6 gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add first item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {initialRows.map((row) => {
            const provider = providerMap[row.provider_profile_id]
            const providerName = provider?.business_name || "Provider"
            const providerSlug = provider?.provider_slug ?? null
            const TypeIcon = getTypeIcon(row.type)

            return (
              <Card key={row.id} className={cn("shadow-sm", !row.is_active && "opacity-75")}>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="gap-1">
                      <TypeIcon className="h-3.5 w-3.5" />
                      {typeLabel[row.type]}
                    </Badge>
                    <Badge variant={row.is_active ? "default" : "secondary"}>
                      {row.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="line-clamp-1 text-base">{providerName}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {providerSlug ? `/providers/${providerSlug}` : "No provider slug"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-4 text-sm text-foreground">{row.content}</p>
                  {row.rating != null && (
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={cn("h-4 w-4", index < (row.rating ?? 0) ? "fill-current" : "text-muted-foreground")}
                        />
                      ))}
                    </div>
                  )}
                  {row.image_url && (
                    <p className="truncate text-xs text-muted-foreground">Image: {row.image_url}</p>
                  )}
                  {row.video_url && (
                    <p className="truncate text-xs text-muted-foreground">Video: {row.video_url}</p>
                  )}
                  {row.author_name && (
                    <p className="text-xs text-muted-foreground">Author: {row.author_name}</p>
                  )}
                  <div className="flex items-center justify-between border-t border-border/70 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => copyEmbedSnippet(providerSlug, row.provider_profile_id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Embed
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit social proof" : "Create social proof"}</DialogTitle>
            <DialogDescription>
              Manage testimonial content for provider websites. Providers cannot create or edit these items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className="truncate">
                      {selectedProvider?.business_name ?? "Search provider by name, city, or slug..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput value={providerQuery} onValueChange={setProviderQuery} placeholder="Search..." />
                    <CommandList>
                      <CommandEmpty>No provider found.</CommandEmpty>
                      <CommandGroup>
                        {providerResults.map((provider) => (
                          <CommandItem
                            key={provider.profile_id}
                            value={provider.profile_id}
                            onSelect={() => {
                              setForm((current) => ({ ...current, providerProfileId: provider.profile_id }))
                              setProviderOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                form.providerProfileId === provider.profile_id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">{provider.business_name ?? "Unnamed provider"}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {[provider.city, provider.provider_slug].filter(Boolean).join(" · ") || provider.profile_id}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value: SocialProofType) => setForm((current) => ({ ...current, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sp-rating">Rating (optional)</Label>
                <Input
                  id="sp-rating"
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))}
                  placeholder="1 - 5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sp-content">Content</Label>
              <Textarea
                id="sp-content"
                rows={4}
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                placeholder="Amazing childcare service!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sp-author">Author (optional)</Label>
              <Input
                id="sp-author"
                value={form.authorName}
                onChange={(event) => setForm((current) => ({ ...current, authorName: event.target.value }))}
                placeholder="Emma"
              />
            </div>

            {form.type === "image" && (
              <div className="space-y-2">
                <Label htmlFor="sp-image-file">Image upload</Label>
                {(imagePreviewUrl || form.imageUrl) && (
                  <div className="space-y-2">
                    <div className="relative h-40 w-full overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={imagePreviewUrl || form.imageUrl}
                        alt="Social proof image preview"
                        fill
                        className="object-cover"
                        sizes="640px"
                        unoptimized={Boolean(imagePreviewUrl)}
                      />
                    </div>
                    {pendingImageFile && (
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={removeImageSelection}>
                        <X className="h-4 w-4" />
                        Remove selected image
                      </Button>
                    )}
                  </div>
                )}
                <Input
                  id="sp-image-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => onPickImage(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, or GIF up to 5MB.</p>
              </div>
            )}

            {form.type === "video" && (
              <div className="space-y-2">
                <Label htmlFor="sp-video-file">Video upload</Label>
                {(videoPreviewUrl || form.videoUrl) && (
                  <div className="space-y-2">
                    <video
                      src={videoPreviewUrl || form.videoUrl || undefined}
                      controls
                      className="w-full rounded-lg border bg-black/90"
                    />
                    {pendingVideoFile && (
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={removeVideoSelection}>
                        <X className="h-4 w-4" />
                        Remove selected video
                      </Button>
                    )}
                  </div>
                )}
                <Input
                  id="sp-video-file"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(event) => onPickVideo(event.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">MP4, WEBM, or MOV up to 25MB.</p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="sp-active">Active</Label>
              <Switch
                id="sp-active"
                checked={form.isActive}
                onCheckedChange={(value) => setForm((current) => ({ ...current, isActive: value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={isPending}>
              {editingId ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this social proof?"
        description="This will remove the selected social proof item."
        itemName={deleteTarget?.content}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
