import type { VisitorGeo } from "./visitor-geo"
import { visitorHasLatLng } from "./visitor-geo"
import type { ActiveProviderRow } from "./search-providers-db"

function matchesAgeTags(row: ActiveProviderRow, ageTags: string[]): boolean {
  const served = row.age_groups_served ?? []
  if (!served.length) return false
  return ageTags.some((tag) => served.some((s) => s.toLowerCase() === tag.toLowerCase()))
}

/** Max distance (km) for “local” featured providers when visitor and provider both have coordinates. */
const LOCAL_RADIUS_KM = 100

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

function normalizeGeoText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function countryCompatible(visitorCode: string | null, providerCode: string | null): boolean {
  if (!visitorCode || !providerCode) return true
  return visitorCode.toUpperCase() === providerCode.toUpperCase()
}

function cityMatchesVisitor(
  row: ActiveProviderRow,
  visitorCity: string,
  visitorCountry: string | null
): boolean {
  const vc = normalizeGeoText(visitorCity)
  if (!vc) return false
  if (!countryCompatible(visitorCountry, row.country_code)) return false

  const pc = normalizeGeoText(row.city ?? "")
  const pa = normalizeGeoText(row.address ?? "")
  if (!pc && !pa) return false

  return pc.includes(vc) || vc.includes(pc) || pa.includes(vc)
}

function matchesByDistance(pool: ActiveProviderRow[], geo: VisitorGeo): ActiveProviderRow[] {
  if (!visitorHasLatLng(geo) || geo.latitude === null || geo.longitude === null) return []

  const vl = geo.latitude
  const vg = geo.longitude

  return pool.filter((row) => {
    const lat = row.latitude
    const lng = row.longitude
    if (lat === null || lng === null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return false
    }
    return haversineKm(vl, vg, lat, lng) <= LOCAL_RADIUS_KM
  })
}

function matchesByCity(pool: ActiveProviderRow[], geo: VisitorGeo): ActiveProviderRow[] {
  const city = geo.city?.trim()
  if (!city) return []

  return pool.filter((row) => cityMatchesVisitor(row, city, geo.countryCode))
}

function matchesByCountryOnly(pool: ActiveProviderRow[], geo: VisitorGeo): ActiveProviderRow[] {
  const cc = geo.countryCode
  if (!cc) return []
  return pool.filter((row) => {
    const p = row.country_code
    if (!p) return false
    return p.toUpperCase() === cc.toUpperCase()
  })
}

function sortFeaturedQuality(a: ActiveProviderRow, b: ActiveProviderRow): number {
  const ratingDiff = (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
  if (ratingDiff !== 0) return ratingDiff
  const reviewDiff = (b.review_count ?? 0) - (a.review_count ?? 0)
  if (reviewDiff !== 0) return reviewDiff
  return (a.business_name ?? "").localeCompare(b.business_name ?? "")
}

function shuffleInPlace<T>(arr: T[], random: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

export type SelectFeaturedProvidersOptions = {
  visitorGeo: VisitorGeo | null
  limit: number
  /** When set, only featured providers matching these age tags are preferred for local + random. */
  ageTags?: string[]
  /** Inject for tests (deterministic shuffle). */
  random?: () => number
}

/**
 * Picks up to `limit` featured providers: local by geo (distance → city → country-only), else random from the same primary pool.
 * When `ageTags` is set and no featured provider matches, falls back to all featured (ignores age) for random/local so the section can still show cards.
 */
export function selectFeaturedProviders(
  allActiveRows: ActiveProviderRow[],
  options: SelectFeaturedProvidersOptions
): ActiveProviderRow[] {
  const { visitorGeo, limit, ageTags, random = Math.random } = options

  const globalFeatured = allActiveRows.filter((r) => r.featured)
  if (globalFeatured.length === 0 || limit <= 0) return []

  let primaryPool = globalFeatured
  if (ageTags?.length) {
    const scoped = globalFeatured.filter((row) => matchesAgeTags(row, ageTags))
    if (scoped.length > 0) {
      primaryPool = scoped
    }
  }

  const pickLocal = (): ActiveProviderRow[] => {
    if (!visitorGeo) return []

    const byDist = matchesByDistance(primaryPool, visitorGeo)
    if (byDist.length > 0) return byDist

    const byCity = matchesByCity(primaryPool, visitorGeo)
    if (byCity.length > 0) return byCity

    const byCountry = matchesByCountryOnly(primaryPool, visitorGeo)
    if (byCountry.length > 0) return byCountry

    return []
  }

  const local = pickLocal()
  if (local.length > 0) {
    return [...local].sort(sortFeaturedQuality).slice(0, limit)
  }

  const source = [...primaryPool]
  shuffleInPlace(source, random)
  return source.slice(0, limit)
}

/** @internal exported for unit tests */
export const __test = {
  haversineKm,
  normalizeGeoText,
  cityMatchesVisitor,
  matchesByDistance,
  matchesByCity,
  matchesByCountryOnly,
  sortFeaturedQuality,
}
