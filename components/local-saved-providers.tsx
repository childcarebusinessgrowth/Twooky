"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getLocalFavoriteSlugs, removeLocalFavorite } from "@/lib/local-favorites"
import { getProviderBySlug } from "@/lib/mock-data"

export function LocalSavedProviders() {
  const [slugs, setSlugs] = useState<string[]>([])

  useEffect(() => {
    setSlugs(getLocalFavoriteSlugs())
  }, [])

  const handleRemove = (slug: string) => {
    removeLocalFavorite(slug)
    setSlugs((prev) => prev.filter((s) => s !== slug))
  }

  if (slugs.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        Saved on this device (demo listings)
      </p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {slugs.map((slug) => {
          const provider = getProviderBySlug(slug)
          const name = provider?.name ?? slug
          return (
            <Card
              key={slug}
              className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-40 w-full overflow-hidden bg-muted relative flex items-center justify-center text-muted-foreground text-sm">
                Saved on this device
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
                    <Link href={`/providers/${slug}`}>View profile</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full border-border/60 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleRemove(slug)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
