import { revalidateTag } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache-tags"

/** Invalidate cached active-provider rows (cards, search results, featured sections). */
export function revalidateActiveProvidersDirectoryCache(): void {
  revalidateTag(CACHE_TAGS.activeProviders, "max")
}

/** Invalidate cached search filter options (admin directory taxonomy changes). */
export function revalidateSearchFilterOptionsCache(): void {
  revalidateTag(CACHE_TAGS.directoryFilters, "max")
}

/** Invalidate footer city links (admin city list / activation changes). */
export function revalidateFooterCitiesCache(): void {
  revalidateTag(CACHE_TAGS.footerCities, "max")
}

/** After metadata-only directory changes (filters, currencies, program types, …). */
export function revalidateDirectoryMetadataCaches(): void {
  revalidateSearchFilterOptionsCache()
}

/** After anything that changes provider listings or per-provider public fields shown on cards. */
export function revalidateProviderDirectoryCaches(): void {
  revalidateActiveProvidersDirectoryCache()
}
