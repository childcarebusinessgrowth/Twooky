export type ProviderTypeLookup = {
  slug: string
  name: string
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9& ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const PROVIDER_TYPE_ALIASES: Record<string, string> = {
  "after school": "afterschool_program",
  "after school program": "afterschool_program",
  "after school programs": "afterschool_program",
  "after school care": "afterschool_program",
  "after-school": "afterschool_program",
  "after-school program": "afterschool_program",
  "after-school programs": "afterschool_program",
  "after-school care": "afterschool_program",
  "afterschool": "afterschool_program",
  "afterschool program": "afterschool_program",
  "afterschool programs": "afterschool_program",
}

export function resolveProviderTypeSlug(
  value: string,
  providerTypes: ProviderTypeLookup[],
): string | null {
  const normalizedInput = normalizeToken(value)
  if (!normalizedInput) return null

  const alias = PROVIDER_TYPE_ALIASES[normalizedInput]
  if (alias) return alias

  const candidates = new Set<string>([normalizedInput])
  if (normalizedInput.endsWith("ies") && normalizedInput.length > 3) {
    candidates.add(normalizedInput.slice(0, -3) + "y")
  }
  if (normalizedInput.endsWith("s") && normalizedInput.length > 1) {
    candidates.add(normalizedInput.slice(0, -1))
  }

  const normalizedCandidates = Array.from(candidates).map((candidate) => candidate.replace(/\s+/g, "_"))
  const match = providerTypes.find((providerType) => {
    const slugMatch = normalizeToken(providerType.slug).replace(/\s+/g, "_")
    const nameMatch = normalizeToken(providerType.name).replace(/\s+/g, "_")
    return normalizedCandidates.includes(slugMatch) || normalizedCandidates.includes(nameMatch)
  })

  return match?.slug ?? null
}

export function normalizeProviderTypeSelections(
  values: string[],
  providerTypes: ProviderTypeLookup[],
): string[] {
  const resolved: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const slug = resolveProviderTypeSlug(value, providerTypes)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    resolved.push(slug)
  }

  return resolved
}
