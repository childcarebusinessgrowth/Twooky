import { getPopularLocationGroups } from "@/lib/locations"

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

export async function getPopularLocationsForHome(): Promise<PopularLocationGroup[]> {
  return getPopularLocationGroups({ countryLimit: 3, citiesPerCountry: 6 })
}
