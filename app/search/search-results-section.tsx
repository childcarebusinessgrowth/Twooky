import { SearchResults } from "@/components/search-results"
import { getSearchPageData, type SearchPageQueryParams } from "@/lib/search-page-data"

export async function SearchResultsSection({
  searchParams,
}: {
  searchParams?: Promise<SearchPageQueryParams | undefined>
}) {
  const resolvedSearchParams = searchParams ? (await searchParams) ?? {} : {}
  const { providers, filterOptions } = await getSearchPageData({
    searchParams: resolvedSearchParams,
  })

  return <SearchResults providers={providers} filterOptions={filterOptions} />
}
