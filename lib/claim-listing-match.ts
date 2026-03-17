/**
 * Fuzzy matching for provider listing claims against admin-managed listings.
 * Compares business name and address with weighted scoring.
 */

export type MatchStatus = "auto_matched" | "possible_match" | "unmatched"

export type MatchResult = {
  status: MatchStatus
  score: number
  matchedProviderProfileId: string | null
  metadata: {
    bestNameScore: number
    bestAddressScore: number
    candidateCount: number
  }
}

const NAME_WEIGHT = 0.6
const ADDRESS_WEIGHT = 0.4
const AUTO_MATCH_THRESHOLD = 0.75
const POSSIBLE_MATCH_THRESHOLD = 0.45

/** Normalize text for comparison: lowercase, collapse whitespace, remove punctuation. */
function normalize(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Simple token-based similarity (Jaccard-like): intersection / union of words. */
function tokenSimilarity(a: string, b: string): number {
  const normA = normalize(a)
  const normB = normalize(b)
  if (!normA || !normB) return 0
  const setA = new Set(normA.split(" "))
  const setB = new Set(normB.split(" "))
  const intersection = [...setA].filter((w) => setB.has(w)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

/** Substring containment bonus: if one string contains the other, boost score. */
function containmentBonus(a: string, b: string): number {
  const normA = normalize(a)
  const normB = normalize(b)
  if (!normA || !normB) return 0
  if (normA.includes(normB) || normB.includes(normA)) return 0.2
  return 0
}

/** Combined similarity for a single field. */
function fieldSimilarity(claim: string, listing: string): number {
  const base = tokenSimilarity(claim, listing)
  const bonus = containmentBonus(claim, listing)
  return Math.min(1, base + bonus)
}

export type AdminManagedListing = {
  profile_id: string
  business_name: string | null
  address: string | null
}

/**
 * Find best matching admin-managed listing for a claim.
 */
export function matchClaimToListing(
  businessName: string,
  businessAddress: string,
  candidates: AdminManagedListing[]
): MatchResult {
  const normName = normalize(businessName)
  const normAddr = normalize(businessAddress)

  if (!candidates.length) {
    return {
      status: "unmatched",
      score: 0,
      matchedProviderProfileId: null,
      metadata: { bestNameScore: 0, bestAddressScore: 0, candidateCount: 0 },
    }
  }

  let bestScore = 0
  let bestId: string | null = null
  let bestNameScore = 0
  let bestAddressScore = 0

  for (const c of candidates) {
    const listName = c.business_name ?? ""
    const listAddr = c.address ?? ""
    const nameScore = fieldSimilarity(normName, listName)
    const addrScore = normAddr && listAddr ? fieldSimilarity(normAddr, listAddr) : nameScore * 0.5
    const combined = NAME_WEIGHT * nameScore + ADDRESS_WEIGHT * addrScore
    if (combined > bestScore) {
      bestScore = combined
      bestId = c.profile_id
      bestNameScore = nameScore
      bestAddressScore = addrScore
    }
  }

  let status: MatchStatus = "unmatched"
  if (bestScore >= AUTO_MATCH_THRESHOLD) status = "auto_matched"
  else if (bestScore >= POSSIBLE_MATCH_THRESHOLD) status = "possible_match"

  return {
    status,
    score: Math.round(bestScore * 10000) / 10000,
    matchedProviderProfileId: bestId,
    metadata: {
      bestNameScore: Math.round(bestNameScore * 10000) / 10000,
      bestAddressScore: Math.round(bestAddressScore * 10000) / 10000,
      candidateCount: candidates.length,
    },
  }
}
