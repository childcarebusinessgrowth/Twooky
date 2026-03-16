import { SearchResults } from "@/components/search-results"
import type { ProviderCardData } from "@/components/provider-card"
import type { SearchFilterOptions } from "@/components/filter-sidebar"
import type { ProviderTypePageConfig } from "@/lib/provider-type-page-config"

type ProviderTypeSearchPageProps = {
  config: ProviderTypePageConfig
  providers: ProviderCardData[]
  filterOptions?: SearchFilterOptions
}

export function ProviderTypeSearchPage({
  config,
  providers,
  filterOptions,
}: ProviderTypeSearchPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-linear-to-b from-primary/10 via-background to-background py-10 md:py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {config.heroTitle}
          </h1>
          <p className="mt-3 max-w-3xl text-base text-muted-foreground">{config.heroDescription}</p>
          <p className="mt-4 max-w-4xl text-sm text-muted-foreground">{config.heroIntro}</p>

        </div>
      </section>

      <SearchResults
        providers={providers}
        filterOptions={filterOptions}
        basePath={config.path}
        defaultProviderType={config.providerType}
        headerTitle={config.headerTitle}
        listTitle={config.listTitle}
        emptyStateTitle={config.emptyStateTitle}
        emptyStateDescription={config.emptyStateDescription}
      />
    </div>
  )
}

