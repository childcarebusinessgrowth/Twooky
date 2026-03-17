"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ImageIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useToast } from "@/hooks/use-toast"
import type { AdminListingDetailPhoto } from "../actions"
import { deleteListingPhoto } from "../actions"
import { ListingPhotoUploader } from "./ListingPhotoUploader"

type AdminListingPhotosSectionProps = {
  profileId: string
  photos: AdminListingDetailPhoto[]
}

export function AdminListingPhotosSection({
  profileId,
  photos,
}: AdminListingPhotosSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<AdminListingDetailPhoto | null>(
    null
  )

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteListingPhoto(profileId, deleteTarget.id)
      if (!result.ok) {
        toast({
          title: "Delete failed",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Photo deleted",
        variant: "success",
      })
      setDeleteTarget(null)
      router.refresh()
    })
  }

  return (
    <>
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Photos ({photos.length})
            </CardTitle>
            <ListingPhotoUploader profileId={profileId} />
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No photos yet. Add photos to showcase your listing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-video overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? "Provider photo"}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-white">
                      {photo.is_primary && (
                        <Badge className="mr-1 border-0 bg-white/20 text-xs text-white hover:bg-white/20">
                          Primary
                        </Badge>
                      )}
                      <span className="line-clamp-2">
                        {photo.caption ?? "—"}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isPending}
                    onClick={() => setDeleteTarget(photo)}
                    aria-label="Delete photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete photo?"
        description="This photo will be permanently removed from the listing."
        variant="delete"
        onConfirm={handleDelete}
      />
    </>
  )
}
