function normalizeCitySlug(value?: string): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.replace(/-/g, " ")
}

/** Same rules as server search (`getSearchPageData` location filter). */
export function resolveLocationTextFromQuery(params: {
  location?: string
  city?: string
}): string | undefined {
  const normalizedLocation = params.location?.trim()
  if (normalizedLocation) return normalizedLocation

  const cityFromSlug = normalizeCitySlug(params.city)
  if (cityFromSlug) return cityFromSlug

  return undefined
}

export function resolveLocationTextFromSearchParams(sp: URLSearchParams): string | undefined {
  return resolveLocationTextFromQuery({
    location: sp.get("location") ?? undefined,
    city: sp.get("city") ?? undefined,
  })
}
