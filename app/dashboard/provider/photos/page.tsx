"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Upload, Pencil, Trash2, MoreVertical, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/components/AuthProvider"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import {
  uploadProviderPhoto,
  updateProviderPhotoCaption,
  setPrimaryProviderPhoto,
  deleteProviderPhoto,
} from "./actions"
import { MAX_PHOTOS_PER_PROVIDER } from "./constants"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"

type PhotoItem = {
  id: string
  url: string
  caption: string | null
  isPrimary: boolean
}

function buildPhotoUrl(storagePath: string): string {
  const supabase = getSupabaseClient()
  const { data } = supabase.storage.from(PROVIDER_PHOTOS_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

function PhotoCard({
  photo,
  onSetPrimary,
  onEditCaption,
  onDelete,
  disabled,
}: {
  photo: PhotoItem
  onSetPrimary: () => void
  onEditCaption: () => void
  onDelete: () => void
  disabled?: boolean
}) {
  return (
    <Card className="group overflow-hidden border-border/50">
      <div className="relative aspect-[4/3]">
        <Image
          src={photo.url}
          alt={photo.caption ?? "Facility photo"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {photo.isPrimary && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
            Primary
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={disabled}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!photo.isPrimary && (
              <DropdownMenuItem onClick={onSetPrimary}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Set as Primary
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onEditCaption}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Caption
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardContent className="p-3">
        <p className="text-sm text-muted-foreground">{photo.caption || "No caption"}</p>
      </CardContent>
    </Card>
  )
}

export default function PhotosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadCaption, setUploadCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editPhotoId, setEditPhotoId] = useState<string | null>(null)
  const [editCaptionValue, setEditCaptionValue] = useState("")
  const [savingCaption, setSavingCaption] = useState(false)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<PhotoItem | null>(null)

  const fetchPhotos = useCallback(async () => {
    if (!user) {
      setPhotos([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const { data, error: fetchError } = await supabase
        .from("provider_photos")
        .select("id, storage_path, caption, is_primary")
        .eq("provider_profile_id", user.id)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
        setPhotos([])
        return
      }

      const items: PhotoItem[] = (data ?? []).map((row) => ({
        id: row.id,
        url: buildPhotoUrl(row.storage_path),
        caption: row.caption,
        isPrimary: row.is_primary,
      }))
      setPhotos(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load photos")
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploadError(null)
    setUploading(true)
    let successCount = 0
    let lastError: string | null = null

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.set("file", file)
        if (uploadCaption.trim()) formData.set("caption", uploadCaption.trim())

        const result = await uploadProviderPhoto(formData)
        if ("error" in result) {
          lastError = result.error
        } else {
          successCount++
        }
      }

      if (successCount > 0) {
        try {
          await fetchPhotos()
        } catch (fetchErr) {
          toast({
            title: "Photo uploaded",
            description: "If you don't see it, refresh the page.",
            variant: "success",
          })
        }
        setUploadCaption("")
        setUploadDialogOpen(false)
        toast({
          title: successCount === 1 ? "Photo uploaded" : `${successCount} photos uploaded`,
          variant: "success",
        })
      }
      if (lastError) {
        setUploadError(lastError)
        toast({ title: "Upload error", description: lastError, variant: "destructive" })
      } else if (successCount === 0) {
        const msg = "Upload failed. Please try again."
        setUploadError(msg)
        toast({ title: "Upload error", description: msg, variant: "destructive" })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again."
      setUploadError(message)
      toast({ title: "Upload error", description: message, variant: "destructive" })
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))
    if (!files.length) return

    setUploadError(null)
    setUploading(true)
    let successCount = 0
    let lastError: string | null = null

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.set("file", file)
        if (uploadCaption.trim()) formData.set("caption", uploadCaption.trim())

        const result = await uploadProviderPhoto(formData)
        if ("error" in result) {
          lastError = result.error
        } else {
          successCount++
        }
      }

      if (successCount > 0) {
        try {
          await fetchPhotos()
        } catch (fetchErr) {
          toast({
            title: "Photo uploaded",
            description: "If you don't see it, refresh the page.",
            variant: "success",
          })
        }
        setUploadCaption("")
        setUploadDialogOpen(false)
        toast({
          title: successCount === 1 ? "Photo uploaded" : `${successCount} photos uploaded`,
          variant: "success",
        })
      }
      if (lastError) {
        setUploadError(lastError)
        toast({ title: "Upload error", description: lastError, variant: "destructive" })
      } else if (successCount === 0) {
        const msg = "Upload failed. Please try again."
        setUploadError(msg)
        toast({ title: "Upload error", description: msg, variant: "destructive" })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed. Please try again."
      setUploadError(message)
      toast({ title: "Upload error", description: message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    setActioningId(photoId)
    const result = await setPrimaryProviderPhoto(photoId)
    setActioningId(null)
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      await fetchPhotos()
      toast({ title: "Primary photo updated", variant: "success" })
    }
  }

  const openEditCaption = (photo: PhotoItem) => {
    setEditPhotoId(photo.id)
    setEditCaptionValue(photo.caption ?? "")
    setEditDialogOpen(true)
  }

  const saveCaption = async () => {
    if (editPhotoId == null) return
    setSavingCaption(true)
    const result = await updateProviderPhotoCaption(editPhotoId, editCaptionValue)
    setSavingCaption(false)
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setEditDialogOpen(false)
      setEditPhotoId(null)
      await fetchPhotos()
      toast({ title: "Caption updated", variant: "success" })
    }
  }

  const handleDeleteClick = (photo: PhotoItem) => {
    setPhotoToDelete(photo)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return
    const result = await deleteProviderPhoto(photoToDelete.id)
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setDeleteDialogOpen(false)
      setPhotoToDelete(null)
      await fetchPhotos()
      toast({ title: "Photo deleted", variant: "success" })
    }
  }

  const uploadContent = (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
      <p className="text-foreground font-medium mb-1">Drag and drop photos here</p>
      <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
      <div className="mb-4">
        <Label htmlFor="upload-caption" className="text-sm text-muted-foreground">
          Optional caption (applies to all in this batch)
        </Label>
        <Input
          id="upload-caption"
          value={uploadCaption}
          onChange={(e) => setUploadCaption(e.target.value)}
          placeholder="e.g. Classroom activities"
          className="mt-1"
        />
      </div>
      <Button variant="outline" onClick={handleUploadClick} disabled={uploading}>
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading…
          </>
        ) : (
          "Choose Files"
        )}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open)
          if (open) setUploadError(null)
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Photos</h1>
            <p className="text-muted-foreground">Manage your facility photos and gallery</p>
          </div>
          <DialogTrigger asChild>
            <Button disabled={photos.length >= MAX_PHOTOS_PER_PROVIDER}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </DialogTrigger>
        </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Photo Gallery Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "—" : photos.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Photos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{MAX_PHOTOS_PER_PROVIDER}</p>
              <p className="text-sm text-muted-foreground">Max Allowed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "—" : Math.max(0, MAX_PHOTOS_PER_PROVIDER - photos.length)}
              </p>
              <p className="text-sm text-muted-foreground">Slots Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onSetPrimary={() => handleSetPrimary(photo.id)}
              onEditCaption={() => openEditCaption(photo)}
              onDelete={() => handleDeleteClick(photo)}
              disabled={!!actioningId}
            />
          ))}

          {photos.length < MAX_PHOTOS_PER_PROVIDER && (
            <DialogTrigger asChild>
              <Card className="border-dashed border-2 border-border hover:border-primary/50 cursor-pointer transition-colors">
                <CardContent className="flex flex-col items-center justify-center aspect-[4/3] text-muted-foreground">
                  <Upload className="h-8 w-8 mb-2" />
                  <p className="text-sm font-medium">Add Photo</p>
                </CardContent>
              </Card>
            </DialogTrigger>
          )}
        </div>
      )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Photos</DialogTitle>
            <DialogDescription>
              Add photos of your facility to attract more parents
            </DialogDescription>
          </DialogHeader>
          {uploadError && (
            <p className="text-sm text-destructive text-center" role="alert">
              {uploadError}
            </p>
          )}
          {uploadContent}
          <p className="text-xs text-muted-foreground text-center">
            Supported formats: JPG, PNG, WebP. Max file size: 10MB
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
            <DialogDescription>Update the caption for this photo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-caption">Caption</Label>
            <Input
              id="edit-caption"
              value={editCaptionValue}
              onChange={(e) => setEditCaptionValue(e.target.value)}
              placeholder="e.g. Classroom activities"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCaption} disabled={savingCaption}>
              {savingCaption ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-border/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Photo Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Use high-quality, well-lit photos that showcase your facility</li>
            <li>• Include photos of different areas: classrooms, playground, dining area</li>
            <li>• Show children engaged in activities (with proper permissions)</li>
            <li>• Keep photos current and representative of your actual space</li>
          </ul>
        </CardContent>
      </Card>

      {photoToDelete && (
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) setPhotoToDelete(null)
          }}
          title="Delete photo?"
          description="This photo will be removed from your listing."
          itemName={photoToDelete.caption ?? undefined}
          variant="delete"
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  )
}
