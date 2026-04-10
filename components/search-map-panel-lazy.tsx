"use client"

import dynamic from "next/dynamic"
import type { ProviderCardData } from "@/components/provider-card"

const SearchMapPanel = dynamic(
  () => import("@/components/search-map-panel").then((m) => m.SearchMapPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] w-full items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
)

type SearchMapPanelLazyProps = {
  providers: ProviderCardData[]
  className?: string
  searchLocation?: string
}

export function SearchMapPanelLazy({ providers, className, searchLocation }: SearchMapPanelLazyProps) {
  return <SearchMapPanel providers={providers} className={className} searchLocation={searchLocation} />
}
