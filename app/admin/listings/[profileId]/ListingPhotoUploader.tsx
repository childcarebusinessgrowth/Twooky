"use client"

import { useRef, useState, useTransition, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { addListingPhotos } from "../actions"

type ListingPhotoUploaderProps = {
  profileId: string
}

export function ListingPhotoUploader({ profileId }: ListingPhotoUploaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedCount, setSelectedCount] = useState(0)

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedCount(Array.from(event.target.files ?? []).length)
  }

  const onUpload = () => {
    const files = Array.from(inputRef.current?.files ?? [])
    if (files.length === 0) {
      toast({ title: "No photos selected", description: "Pick one or more photos to upload.", variant: "destructive" })
      return
    }

    const formData = new FormData()
    for (const file of files) formData.append("photos", file)

    startTransition(async () => {
      const result = await addListingPhotos(profileId, formData)
      if (!result.ok) {
        toast({ title: "Upload failed", description: result.error, variant: "destructive" })
        return
      }
      setSelectedCount(0)
      if (inputRef.current) inputRef.current.value = ""
      toast({
        title: "Photos uploaded",
        description: result.added === 1 ? "1 photo added." : `${result.added} photos added.`,
        variant: "success",
      })
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={onFileChange}
        className="max-w-sm"
      />
      <Button type="button" variant="outline" size="sm" onClick={onUpload} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
        Upload
      </Button>
      <span className="text-xs text-muted-foreground">
        {selectedCount > 0 ? `${selectedCount} selected` : "PNG/JPG/WebP, max 10MB each"}
      </span>
    </div>
  )
}
