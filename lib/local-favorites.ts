export const LOCAL_FAVORITES_KEY = "eld:favorite-slugs"

export function getLocalFavoriteSlugs(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(LOCAL_FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : []
  } catch {
    return []
  }
}

export function setLocalFavoriteSlugs(slugs: string[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(slugs))
  } catch {
    // ignore
  }
}

export function addLocalFavorite(slug: string) {
  const slugs = getLocalFavoriteSlugs()
  if (slugs.includes(slug)) return
  setLocalFavoriteSlugs([...slugs, slug])
}

export function removeLocalFavorite(slug: string) {
  setLocalFavoriteSlugs(getLocalFavoriteSlugs().filter((s) => s !== slug))
}
