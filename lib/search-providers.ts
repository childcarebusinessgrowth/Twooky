import { providers, type Provider } from "./mock-data"

export type AgeTag = "infant" | "toddler" | "preschool" | "prek" | "schoolage"

export interface SearchCriteria {
  locationText?: string
  queryText?: string
  centerLat?: number
  centerLng?: number
  radiusKm?: number

  ageTags?: AgeTag[]
  programTypes?: string[]
  providerTypes?: string[]
  curriculumTypes?: string[]

  minTuition?: number
  maxTuition?: number

  availability?: Array<Provider["availability"]>
  minRating?: number

  languages?: string[]
  specialNeedsOnly?: boolean
}

const EARTH_RADIUS_KM = 6371

function toRadians(deg: number) {
  return (deg * Math.PI) / 180
}

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

const KNOWN_LOCATIONS: Array<{
  match: (text: string) => boolean
  lat: number
  lng: number
}> = [
  {
    match: (t) => /austin/i.test(t),
    lat: 30.2672,
    lng: -97.7431,
  },
  {
    match: (t) => /phoenix/i.test(t),
    lat: 33.4484,
    lng: -112.074,
  },
  {
    match: (t) => /miami/i.test(t),
    lat: 25.7617,
    lng: -80.1918,
  },
  {
    match: (t) => /dallas/i.test(t),
    lat: 32.7767,
    lng: -96.797,
  },
  {
    match: (t) => /(san diego|san-diego)/i.test(t),
    lat: 32.7157,
    lng: -117.1611,
  },
]

export function resolveLocationToCoords(locationText?: string):
  | { lat: number; lng: number }
  | undefined {
  if (!locationText) return undefined
  const trimmed = locationText.trim()
  if (!trimmed) return undefined

  const match = KNOWN_LOCATIONS.find((loc) => loc.match(trimmed))
  if (match) {
    return { lat: match.lat, lng: match.lng }
  }

  return undefined
}

function matchesTextLocation(p: Provider, locationText?: string): boolean {
  if (!locationText) return true
  const q = locationText.toLowerCase()
  return (
    p.city.toLowerCase().includes(q) ||
    p.state.toLowerCase().includes(q) ||
    p.location.toLowerCase().includes(q) ||
    p.address.toLowerCase().includes(q)
  )
}

function matchesKeyword(p: Provider, queryText?: string): boolean {
  if (!queryText) return true
  const q = queryText.toLowerCase().trim()
  if (!q) return true

  return (
    p.name.toLowerCase().includes(q) ||
    p.shortDescription.toLowerCase().includes(q) ||
    p.location.toLowerCase().includes(q) ||
    p.address.toLowerCase().includes(q) ||
    p.providerTypes.some((type) => type.toLowerCase().includes(q)) ||
    p.programTypes.some((type) => type.toLowerCase().includes(q)) ||
    p.languages.some((language) => language.toLowerCase().includes(q)) ||
    p.curriculumType.toLowerCase().includes(q)
  )
}

function matchesRadius(p: Provider, centerLat?: number, centerLng?: number, radiusKm?: number): boolean {
  if (
    centerLat === undefined ||
    centerLng === undefined ||
    radiusKm === undefined ||
    radiusKm <= 0
  ) {
    return true
  }
  const distance = haversineDistanceKm(centerLat, centerLng, p.latitude, p.longitude)
  return distance <= radiusKm
}

function matchesArray<T>(
  values: T[] | undefined,
  providerValues: T[] | undefined,
): boolean {
  if (!values || values.length === 0) return true
  if (!providerValues || providerValues.length === 0) return false
  return values.some((v) => providerValues.includes(v))
}

function computeRankingScore(p: Provider, maxReviewCount: number, now: Date): number {
  const profileScore = p.profileCompleteness // 0–1

  const ratingScore = p.rating / 5

  const volumeNorm =
    maxReviewCount > 0 ? Math.log(p.reviewCount + 1) / Math.log(maxReviewCount + 1) : 0

  const updatedAt = new Date(p.lastUpdated)
  const daysSinceUpdate = isNaN(updatedAt.getTime())
    ? 365
    : Math.max(0, (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
  const recencyScore = Math.exp(-daysSinceUpdate / 365) // ~1 for very recent, decays over a year

  const responseScore = p.responseRate // 0–1

  const verificationBoost = p.isVerified ? 0.1 : 0

  const subscriptionBoost =
    p.subscriptionTier === "premium" ? 0.25 : p.subscriptionTier === "featured" ? 0.15 : 0

  const wProfile = 0.2
  const wRating = 0.25
  const wVolume = 0.15
  const wRecency = 0.15
  const wResponse = 0.15
  const wVerification = 0.05
  const wSubscription = 0.05

  const score =
    wProfile * profileScore +
    wRating * ratingScore +
    wVolume * volumeNorm +
    wRecency * recencyScore +
    wResponse * responseScore +
    wVerification * verificationBoost +
    wSubscription * subscriptionBoost

  return score
}

export function filterProviders(allProviders: Provider[] = providers, criteria: SearchCriteria = {}) {
  const {
    locationText,
    queryText,
    centerLat,
    centerLng,
    radiusKm,
    ageTags,
    programTypes,
    providerTypes,
    curriculumTypes,
    minTuition,
    maxTuition,
    availability,
    minRating,
    languages,
    specialNeedsOnly,
  } = criteria

  const filtered = allProviders.filter((p) => {
    if (!matchesTextLocation(p, locationText)) {
      return false
    }

    if (!matchesKeyword(p, queryText)) {
      return false
    }

    if (!matchesRadius(p, centerLat, centerLng, radiusKm)) {
      return false
    }

    if (ageTags && ageTags.length > 0 && !matchesArray(ageTags, p.ageTags)) {
      return false
    }

    if (programTypes && programTypes.length > 0 && !matchesArray(programTypes, p.programTypes)) {
      return false
    }

    if (providerTypes && providerTypes.length > 0 && !matchesArray(providerTypes, p.providerTypes as string[])) {
      return false
    }

    if (
      curriculumTypes &&
      curriculumTypes.length > 0 &&
      !curriculumTypes.some(
        (c) => p.curriculumType.toLowerCase() === c.toLowerCase(),
      )
    ) {
      return false
    }

    if (minTuition !== undefined && p.maxTuition < minTuition) {
      return false
    }
    if (maxTuition !== undefined && p.minTuition > maxTuition) {
      return false
    }

    if (availability && availability.length > 0 && !availability.includes(p.availability)) {
      return false
    }

    if (minRating !== undefined && p.rating < minRating) {
      return false
    }

    if (languages && languages.length > 0 && !matchesArray(languages, p.languages)) {
      return false
    }

    if (specialNeedsOnly && !p.specialNeeds) {
      return false
    }

    return true
  })

  const now = new Date()
  const maxReviewCount = filtered.reduce(
    (max, p) => (p.reviewCount > max ? p.reviewCount : max),
    0,
  )

  return filtered
    .map((p) => ({
      provider: p,
      score: computeRankingScore(p, maxReviewCount, now),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.provider)
}

