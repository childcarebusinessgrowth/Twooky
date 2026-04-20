import "server-only"

import { unstable_cache } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { mapCountryRowsToMarketOptions, type CountryRow, type MarketOption } from "@/lib/market-option-mapping"
export type { MarketOption } from "@/lib/market-option-mapping"

const FALLBACK_MARKET_OPTIONS: MarketOption[] = [
  { id: "uk", label: "United Kingdom" },
  { id: "us", label: "United States" },
  { id: "uae", label: "UAE" },
]

export async function getMarketOptions(): Promise<MarketOption[]> {
  return unstable_cache(
    async () => {
      const supabase = getSupabaseAdminClient()
      const { data, error } = await supabase
        .from("countries")
        .select("code, name, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })

      if (error) {
        console.error("[market-options] Failed to load market options", error.message)
        return FALLBACK_MARKET_OPTIONS
      }

      const rows = ((data ?? []) as CountryRow[]).filter(
        (row) => typeof row.code === "string" && typeof row.name === "string",
      )

      if (rows.length === 0) return FALLBACK_MARKET_OPTIONS

      const mapped = mapCountryRowsToMarketOptions(rows)

      if (mapped.length === 0) return FALLBACK_MARKET_OPTIONS
      return mapped
    },
    ["market-options"],
    { revalidate: 3600 },
  )()
}
