"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { removeFavorite } from "@/lib/parent-engagement"

type Props = {
  parentProfileId: string
  providerProfileId: string
  providerName: string
  providerSlug: string | null
}

export function ParentSavedPreviewRow({
  parentProfileId,
  providerProfileId,
  providerName,
  providerSlug,
}: Props) {
  const router = useRouter()

  const handleRemove = async () => {
    const { error } = await removeFavorite(
      getSupabaseClient(),
      parentProfileId,
      providerProfileId
    )
    if (!error) router.refresh()
  }

  const href = providerSlug ? `/providers/${providerSlug}` : "/dashboard/parent/saved"

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/50 px-3 py-2.5">
      <div className="h-14 w-16 shrink-0 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground text-xs">
        Saved
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-foreground truncate">
          {providerName || "Provider"}
        </p>
        {providerSlug && (
          <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 text-primary" />
            <span>View profile</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Button asChild size="sm" className="h-7 rounded-full px-3 text-[11px]">
          <Link href={href}>View</Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={() => void handleRemove()}
        >
          Remove
        </Button>
      </div>
    </div>
  )
}
