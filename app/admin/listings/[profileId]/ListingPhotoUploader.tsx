"use client"

import { useRef, useCallback, useTransition, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addListingPhotos } from "../actions"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]

type ListingPhotoUploaderProps = {
  profileId: string
}

export function ListingPhotoUploader({ profileId }: ListingPhotoUploaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const uploadFiles = useCallback(
    (files: File[]) => {
      const valid = files.filter((f) => ALLOWED_TYPES.includes(f.type))
      if (valid.length === 0) {
        toast({
          title: "Invalid files",
          description: "Only PNG, JPG, and WebP images are supported.",
          variant: "destructive",
        })
        return
      }

      const formData = new FormData()
      for (const file of valid) formData.append("photos", file)

      startTransition(async () => {
        const result = await addListingPhotos(profileId, formData)
        if (!result.ok) {
          toast({
            title: "Upload failed",
            description: result.error,
            variant: "destructive",
          })
          return
        }
        toast({
          title: "Photos uploaded",
          description:
            result.added === 1
              ? "1 photo added."
              : `${result.added} photos added.`,
          variant: "success",
        })
        router.refresh()
      })
    },
    [profileId, router, toast],
  )

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length === 0) return
      uploadFiles(files)
      e.target.value = ""
    },
    [uploadFiles],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files ?? []).filter((f) =>
        ALLOWED_TYPES.includes(f.type),
      )
      if (files.length === 0) {
        toast({
          title: "Invalid files",
          description: "Only PNG, JPG, and WebP images are supported.",
          variant: "destructive",
        })
        return
      }
      uploadFiles(files)
    },
    [uploadFiles, toast],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={handleFileChange}
        className="sr-only"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-muted/50 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Add photos
      </button>
      <span className="text-xs text-muted-foreground">
        PNG, JPG, WebP · max 10MB each
      </span>
    </div>
  )
}
