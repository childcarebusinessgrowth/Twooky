"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Award, ChevronDown, Loader2, MoreVertical, Pencil, Star, Trash2 } from "lucide-react"
import {
  updateListingStatus,
  updateListingFeatured,
  updateListingEarlyLearningExcellenceBadge,
  updateListingVerifiedProviderBadge,
  updateListingVerifiedProviderBadgeColor,
  deleteListing,
  type ListingStatus,
} from "../actions"
import { VERIFIED_BADGE_COLORS } from "@/components/verified-provider-badge"

type ListingDetailActionsProps = {
  profileId: string
  listingStatus: string
  featured: boolean
  earlyLearningExcellenceBadge: boolean
  verifiedProviderBadge: boolean
  verifiedProviderBadgeColor: string | null
  name: string
}

const STATUS_OPTIONS: { value: ListingStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
]

export function ListingDetailActions({
  profileId,
  listingStatus,
  featured,
  earlyLearningExcellenceBadge,
  verifiedProviderBadge,
  verifiedProviderBadgeColor,
  name,
}: ListingDetailActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedVerifiedBadgeColor, setSelectedVerifiedBadgeColor] = useState(
    verifiedProviderBadgeColor ?? "emerald"
  )

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

  const handleToggleEarlyLearningExcellence = () => {
    startTransition(async () => {
      await updateListingEarlyLearningExcellenceBadge(
        profileId,
        !earlyLearningExcellenceBadge
      )
      router.refresh()
    })
  }

  const handleToggleVerifiedProvider = () => {
    startTransition(async () => {
      await updateListingVerifiedProviderBadge(profileId, !verifiedProviderBadge)
      router.refresh()
    })
  }

  const handleSaveVerifiedBadgeColor = () => {
    startTransition(async () => {
      await updateListingVerifiedProviderBadgeColor(profileId, selectedVerifiedBadgeColor)
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

  const currentStatusLabel =
    STATUS_OPTIONS.find((o) => o.value === listingStatus)?.label ?? listingStatus

  return (
    <>
      <div className="flex flex-col items-stretch gap-3">
        <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/listings/${profileId}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending}>
              Status: {currentStatusLabel}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={listingStatus}
              onValueChange={(v) => handleStatus(v as ListingStatus)}
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  disabled={isPending}
                >
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending}>
              <MoreVertical className="h-4 w-4" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleToggleFeatured}
              disabled={isPending}
            >
              <Star className={`h-4 w-4 ${featured ? "fill-current" : ""}`} />
              {featured ? "Remove feature" : "Feature"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleToggleEarlyLearningExcellence}
              disabled={isPending}
            >
              <Award className="h-4 w-4" />
              {earlyLearningExcellenceBadge
                ? "Remove Early Learning Excellence"
                : "Assign Early Learning Excellence"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        </div>

        <div className="rounded-md border border-border/60 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-44 flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Verified Provider badge color
              </Label>
              <Select
                value={selectedVerifiedBadgeColor}
                onValueChange={setSelectedVerifiedBadgeColor}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERIFIED_BADGE_COLORS.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveVerifiedBadgeColor}
              disabled={isPending}
            >
              Save color
            </Button>
            <Button
              variant={verifiedProviderBadge ? "secondary" : "default"}
              size="sm"
              onClick={handleToggleVerifiedProvider}
              disabled={isPending}
            >
              {verifiedProviderBadge
                ? "Remove Verified Provider"
                : "Assign Verified Provider"}
            </Button>
          </div>
        </div>
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
