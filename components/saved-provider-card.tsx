"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { removeFavorite } from "@/lib/parent-engagement"
import type { ParentFavoriteRow } from "@/lib/parent-engagement"

type Props = {
  parentProfileId: string
  favorite: ParentFavoriteRow
}

export function SavedProviderCard({ parentProfileId, favorite }: Props) {
  const router = useRouter()
  const name = favorite.provider_business_name ?? "Provider"
  const href = favorite.provider_slug
    ? `/providers/${favorite.provider_slug}`
    : "/dashboard/parent/saved"

  const handleRemove = async () => {
    const { error } = await removeFavorite(
      getSupabaseClient(),
      parentProfileId,
      favorite.provider_profile_id
    )
    if (!error) router.refresh()
  }

  return (
    <Card className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="h-40 w-full overflow-hidden bg-muted relative flex items-center justify-center text-muted-foreground text-sm">
        Saved provider
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground line-clamp-1">
          {name}
        </CardTitle>
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
            onClick={() => void handleRemove()}
          >
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
