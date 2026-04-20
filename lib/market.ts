import type { VisitorGeo } from "@/lib/visitor-geo"

export type MarketId = "uk" | "us" | "uae" | "global"
export type SelectableMarketId = Exclude<MarketId, "global">

/** Explicit country markets shown in selectors. */
export const MARKET_IDS: SelectableMarketId[] = ["uk", "us", "uae"]

export function parseMarketId(raw: string | null | undefined): MarketId | null {
  if (raw === "uk" || raw === "us" || raw === "uae" || raw === "global") return raw
  return null
}

/** Normalize country aliases to canonical ISO-2 (GB/US/AE). */
export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const c = raw.trim().toUpperCase()
  if (c === "UK" || c === "GBR") return "GB"
  if (c === "USA") return "US"
  if (c === "UAE" || c === "UNITED ARAB EMIRATES") return "AE"
  if (/^[A-Z]{2}$/.test(c)) return c
  return null
}

/** Resolve known DB/ISO country code aliases to supported market IDs. */
export function marketIdFromCountryCode(raw: string | null | undefined): MarketId | null {
  const code = normalizeCountryCode(raw)
  if (code === "GB") return "uk"
  if (code === "US") return "us"
  if (code === "AE") return "uae"
  return null
}

/** ISO 3166-1 alpha-2 for provider / geo matching */
export function marketToVisitorCountryCode(market: MarketId): string | null {
  if (market === "uk") return "GB"
  if (market === "us") return "US"
  if (market === "uae") return "AE"
  return null
}

export function visitorGeoForMarket(market: MarketId): VisitorGeo {
  return {
    city: null,
    countryCode: marketToVisitorCountryCode(market),
    latitude: null,
    longitude: null,
  }
}

/** `PopularLocationGroup.country` is uppercased DB country code */
export function popularLocationGroupMatchesMarket(
  groupCountryCode: string,
  market: MarketId,
): boolean {
  if (market === "global") return true
  const g = normalizeCountryCode(groupCountryCode)
  if (!g) return false
  if (market === "uk") return g === "GB"
  if (market === "us") return g === "US"
  if (market === "uae") return g === "AE"
  return false
}

/** Match Supabase city rows that join `countries.code` and/or `search_country_code`. */
export function cityRowMatchesMarket(
  relationCode: string | null | undefined,
  searchCountryCode: string | null | undefined,
  market: MarketId,
): boolean {
  const candidates = [relationCode, searchCountryCode].filter(
    (c): c is string => typeof c === "string" && c.trim().length > 0,
  )
  for (const c of candidates) {
    if (popularLocationGroupMatchesMarket(c, market)) return true
  }
  return false
}

/** Map Vercel / CDN IP country header to market */
export function ipCountryToMarket(ipCountry: string | null | undefined): MarketId | null {
  return marketIdFromCountryCode(ipCountry)
}

/**
 * Prefix for Daily Fee filter labels and active-filter chips (UK £, US $, UAE AED).
 */
export function dailyFeeFilterCurrencyPrefix(market: MarketId): string {
  if (market === "uk") return "£"
  if (market === "us") return "$"
  if (market === "uae") return "AED"
  return ""
}
