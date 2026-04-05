/**
 * Next.js `unstable_cache` / `revalidateTag` identifiers for public directory data.
 * Keep values stable across deploys so on-demand revalidation keeps working.
 */
export const CACHE_TAGS = {
  /** Full active-provider row set (search, home, program pages, parent recommendations). */
  activeProviders: "dir:active-providers",
  /** Search sidebar filters (age groups, program types, languages, …). */
  directoryFilters: "dir:search-filters",
  /** Footer “browse cities” links (randomized subset, cached). */
  footerCities: "dir:footer-cities",
} as const
