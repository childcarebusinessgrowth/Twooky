import { Suspense } from "react"
import { SearchResults } from "@/components/search-results"
import { getSearchPageData, type SearchPageQueryParams } from "@/lib/search-page-data"

export const metadata = {
  title: "Search Childcare | Early Learning Directory",
  description: "Search and compare childcare providers in your area. Filter by age group, program type, price, and more.",
}

interface SearchPageProps {
  searchParams?: Promise<SearchPageQueryParams>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const { providers, filterOptions } = await getSearchPageData({
    searchParams: resolvedSearchParams,
  })

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SearchResults providers={providers} filterOptions={filterOptions} />
    </Suspense>
  )
}
