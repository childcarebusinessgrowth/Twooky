import { getPopularLocationGroups } from "@/lib/locations"
import type { MarketId } from "@/lib/market"
import { popularLocationGroupMatchesMarket } from "@/lib/market"

export interface PopularLocation {
  label: string
  href: string
}

export interface PopularLocationGroup {
  country: string
  locations: PopularLocation[]
}

export async function getPopularLocations(): Promise<PopularLocationGroup[]> {
  return getPopularLocationGroups()
}

export async function getPopularLocationsForHome(
  market?: MarketId,
): Promise<PopularLocationGroup[]> {
  const all = await getPopularLocationGroups({ countryLimit: 3, citiesPerCountry: 6 })
  if (!market) return all
  const filtered = all.filter((g) => popularLocationGroupMatchesMarket(g.country, market))
  return filtered.length > 0 ? filtered : all
}
