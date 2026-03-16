"use client"

import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { addFavorite } from "@/lib/parent-engagement"

type Props = {
  parentProfileId: string
  providerProfileId: string
  className?: string
}

export function RecommendedProviderSaveButton({
  parentProfileId,
  providerProfileId,
  className,
}: Props) {
  const router = useRouter()

  const handleSave = async () => {
    const { error } = await addFavorite(
      getSupabaseClient(),
      parentProfileId,
      providerProfileId
    )
    if (!error) router.refresh()
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className={className}
      onClick={() => void handleSave()}
    >
      <Heart className="mr-1.5 h-3.5 w-3.5" />
      Save
    </Button>
  )
}
