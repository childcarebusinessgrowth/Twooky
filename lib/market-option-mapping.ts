import { marketIdFromCountryCode, type MarketId } from "@/lib/market"

export type MarketOption = {
  id: MarketId
  label: string
}

export type CountryRow = {
  code: string
  name: string
  sort_order: number | null
}

const FALLBACK_LABELS: Record<MarketId, string> = {
  global: "Global",
  uk: "United Kingdom",
  us: "United States",
  uae: "UAE",
}

export function mapCountryRowsToMarketOptions(rows: CountryRow[]): MarketOption[] {
  const mapped = rows
    .map((row) => {
      const id = marketIdFromCountryCode(row.code)
      if (!id) return null
      return {
        id,
        label: row.name.trim() || FALLBACK_LABELS[id] || id,
      } satisfies MarketOption
    })
    .filter((option): option is MarketOption => option !== null)

  const deduped: MarketOption[] = []
  const seen = new Set<MarketId>()
  for (const option of mapped) {
    if (seen.has(option.id)) continue
    seen.add(option.id)
    deduped.push(option)
  }
  return deduped
}
