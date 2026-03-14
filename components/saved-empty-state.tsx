"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getLocalFavoriteSlugs } from "@/lib/local-favorites"

type Props = {
  hasDbFavorites: boolean
}

export function SavedEmptyState({ hasDbFavorites }: Props) {
  const [localSlugs, setLocalSlugs] = useState<string[]>([])

  useEffect(() => {
    setLocalSlugs(getLocalFavoriteSlugs())
  }, [])

  const showEmpty = !hasDbFavorites && localSlugs.length === 0
  if (!showEmpty) return null

  return (
    <Card className="rounded-3xl border border-border/60">
      <CardContent className="p-8 text-center text-muted-foreground">
        <p className="font-medium text-foreground">No saved providers yet</p>
        <p className="mt-1 text-sm">
          When you find a provider you like, click the heart on their profile to save them here.
        </p>
        <Button asChild size="sm" className="mt-4 rounded-full">
          <Link href="/search">Search providers</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
