"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { EarlyLearningExcellenceBadge } from "@/components/early-learning-excellence-badge"
import { VerifiedProviderBadge } from "@/components/verified-provider-badge"
import { DirectoryBadge } from "@/components/directory-badge"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { removeFavorite } from "@/lib/parent-engagement"
import type { ParentFavoriteRow } from "@/lib/parent-engagement"

type Props = {
  parentProfileId: string
  favorite: ParentFavoriteRow
}

export function SavedProviderCard({ parentProfileId, favorite }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const name = favorite.provider_business_name ?? "Provider"
  const href = favorite.provider_slug
    ? `/providers/${favorite.provider_slug}`
    : "/dashboard/parent/saved"

  const handleRemoveConfirm = async () => {
    const { error } = await removeFavorite(
      getSupabaseClient(),
      parentProfileId,
      favorite.provider_profile_id
    )
    if (!error) {
      setRemoveDialogOpen(false)
      toast({
        title: "Removed from saved",
        description: "Provider removed from your list.",
        variant: "success",
      })
      router.refresh()
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="h-40 w-full overflow-hidden bg-muted relative flex items-center justify-center text-muted-foreground text-sm">
        {favorite.provider_primary_image_url ? (
          <Image
            src={favorite.provider_primary_image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          "Saved provider"
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base font-semibold text-foreground line-clamp-1">
            {name}
          </CardTitle>
          {favorite.verified_provider_badge && (
            <VerifiedProviderBadge
              size="sm"
              color={favorite.verified_provider_badge_color}
            />
          )}
          {favorite.early_learning_excellence_badge && (
            <EarlyLearningExcellenceBadge size="sm" />
          )}
          {(favorite.directory_badges ?? []).map((badge) => (
            <DirectoryBadge key={badge.id} badge={badge} size="sm" />
          ))}
        </div>
        <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          View profile to learn more
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" className="flex-1 rounded-full">
            <Link href={href}>View profile</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-border/60 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setRemoveDialogOpen(true)}
          >
            Remove
          </Button>
        </div>
      </CardContent>

      <ConfirmDeleteDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        title="Remove from saved?"
        description="This provider will be removed from your saved list."
        itemName={name}
        variant="remove"
        onConfirm={handleRemoveConfirm}
      />
    </Card>
  )
}
