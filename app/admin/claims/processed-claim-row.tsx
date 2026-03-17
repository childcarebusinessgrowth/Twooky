"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Building2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { AdminClaimRow } from "./actions"
import { deleteClaim } from "./actions"

export function ProcessedClaimRow({ claim }: { claim: AdminClaimRow }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const reviewedAt = claim.reviewed_at
    ? new Date(claim.reviewed_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—"

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteClaim(claim.id)
    setIsDeleting(false)
    if (result.success) {
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{claim.business_name}</p>
          <p className="text-sm text-muted-foreground">
            {claim.claimant_name} · Processed {reviewedAt}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {claim.status === "rejected" && claim.review_notes && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            {claim.review_notes}
          </span>
        )}
        <Badge
          variant={claim.status === "approved" ? "default" : "destructive"}
          className={claim.status === "approved" ? "bg-primary" : ""}
        >
          {claim.status === "approved" ? "Approved" : "Rejected"}
        </Badge>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete claim request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the claim for {claim.business_name}? This will permanently remove the
                claim and its verification documents.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  void handleDelete()
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
