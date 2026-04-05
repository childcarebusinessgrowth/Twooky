"use client"

import dynamic from "next/dynamic"

export const ProviderLocationMapLazy = dynamic(
  () => import("./provider-location-map").then((m) => m.ProviderLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] w-full items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/40 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
)
