"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Star, Trash2 } from "lucide-react"
import {
  updateListingStatus,
  updateListingFeatured,
  deleteListing,
  type ListingStatus,
} from "../actions"

type ListingDetailActionsProps = {
  profileId: string
  listingStatus: string
  featured: boolean
  name: string
}

export function ListingDetailActions({
  profileId,
  listingStatus,
  featured,
  name,
}: ListingDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleStatus = (status: ListingStatus) => {
    startTransition(async () => {
      await updateListingStatus(profileId, status)
      router.refresh()
    })
  }

  const handleToggleFeatured = () => {
    startTransition(async () => {
      await updateListingFeatured(profileId, !featured)
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      await deleteListing(profileId)
      setShowDeleteConfirm(false)
      router.push("/admin/listings")
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={listingStatus === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatus("active")}
          disabled={isPending}
        >
          Set active
        </Button>
        <Button
          variant={listingStatus === "inactive" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatus("inactive")}
          disabled={isPending}
        >
          Set inactive
        </Button>
        <Button
          variant={listingStatus === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatus("pending")}
          disabled={isPending}
        >
          Set pending
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleFeatured}
          disabled={isPending}
        >
          <Star className="h-4 w-4 mr-1" />
          {featured ? "Remove feature" : "Feature"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{name}&quot; and all associated
              photos and reviews. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
