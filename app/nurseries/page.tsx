import type { Metadata } from "next"
import { ProviderTypeSearchPage } from "@/components/provider-type-search-page"
import { getSearchPageData, type SearchPageQueryParams } from "@/lib/search-page-data"
import { getProviderTypePageConfig } from "@/lib/provider-type-page-config"

const config = getProviderTypePageConfig("nursery")

export const metadata: Metadata = {
  title: config.metadataTitle,
  description: config.metadataDescription,
}

interface NurseriesSearchPageProps {
  searchParams?: Promise<SearchPageQueryParams>
}

export default async function NurseriesSearchPage({ searchParams }: NurseriesSearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const { providers, filterOptions } = await getSearchPageData({
    searchParams: resolvedSearchParams,
    forcedProviderType: config.providerType,
  })

  return (
    <ProviderTypeSearchPage config={config} providers={providers} filterOptions={filterOptions} />
  )
}

