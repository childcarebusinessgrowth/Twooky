import { ReactNode } from "react"
import { SearchBar } from "@/components/search-bar"

type ProviderTypeSearchPageProps = {
  title: string
  description: string
  intro?: string
  defaultProviderType: string
  children?: ReactNode
}

export function ProviderTypeSearchPage({
  title,
  description,
  intro,
  defaultProviderType,
  children,
}: ProviderTypeSearchPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-card/70 py-8">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">{description}</p>
          {intro && <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{intro}</p>}
        </div>
      </section>

      <section className="border-b border-border bg-background py-6">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <SearchBar
            variant="hero"
            className="shadow-md"
            defaultProviderType={defaultProviderType}
            searchButtonLabel="Search providers"
          />
        </div>
      </section>

      {children && (
        <section className="py-10">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">{children}</div>
        </section>
      )}
    </div>
  )
}

