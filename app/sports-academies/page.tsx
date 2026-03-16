import type { Metadata } from "next"
import { ProviderTypeSearchPage } from "@/components/provider-type-search-page"
import { getSearchPageData, type SearchPageQueryParams } from "@/lib/search-page-data"
import { getProviderTypePageConfig } from "@/lib/provider-type-page-config"

const config = getProviderTypePageConfig("sports_academy")

export const metadata: Metadata = {
  title: config.metadataTitle,
  description: config.metadataDescription,
}

interface SportsAcademiesSearchPageProps {
  searchParams?: Promise<SearchPageQueryParams>
}

export default async function SportsAcademiesSearchPage({
  searchParams,
}: SportsAcademiesSearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const { providers, filterOptions } = await getSearchPageData({
    searchParams: resolvedSearchParams,
    forcedProviderType: config.providerType,
  })

  return (
    <ProviderTypeSearchPage config={config} providers={providers} filterOptions={filterOptions} />
  )
}

