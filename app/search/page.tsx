import { Suspense } from "react"
import { SearchResultsSection } from "@/app/search/search-results-section"
import type { SearchPageQueryParams } from "@/lib/search-page-data"

export const metadata = {
  title: "Search Childcare | Twooky",
  description: "Search and compare childcare providers in your area. Filter by age group, program type, price, and more.",
}

interface SearchPageProps {
  searchParams?: Promise<SearchPageQueryParams>
}

function SearchResultsFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
      <span className="text-sm">Loading providers…</span>
    </div>
  )
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<SearchResultsFallback />}>
      <SearchResultsSection searchParams={searchParams} />
    </Suspense>
  )
}
