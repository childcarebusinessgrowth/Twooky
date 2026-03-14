"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MapPin, SlidersHorizontal } from "lucide-react"
import { SearchBar } from "@/components/search-bar"
import { FilterSidebar, type FilterState, type SearchFilterOptions } from "@/components/filter-sidebar"
import { ProviderCard, type ProviderCardData } from "@/components/provider-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SearchMapPanel } from "@/components/search-map-modal"

const PAGE_SIZE = 9
const AGE_TAG_TO_LABEL: Record<string, string> = {
  infant: "Infant (0-12 months)",
  toddler: "Toddler (1-2 years)",
  preschool: "Preschool (3-4 years)",
  prek: "Pre-K (4-5 years)",
  schoolage: "School Age (5+)",
}

type SearchResultsProps = {
  providers: ProviderCardData[]
  filterOptions?: SearchFilterOptions
}

export function SearchResults({ providers, filterOptions }: SearchResultsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const buildActiveFilters = useCallback(() => {
    const chips: { key: string; label: string; param: string; value?: string }[] = []
    if (!searchParams) return chips

    const sp = searchParams

    const age = sp.get("age")
    if (age) {
      chips.push({
        key: `age:${age}`,
        param: "age",
        value: age,
        label: AGE_TAG_TO_LABEL[age] ?? "Age",
      })
    }

    const ageGroups = sp.get("ageGroups")
    if (ageGroups) {
      ageGroups.split(",").forEach((tag) => {
        const trimmed = tag.trim()
        if (!trimmed) return
        chips.push({
          key: `ageGroups:${trimmed}`,
          param: "ageGroups",
          value: trimmed,
          label: AGE_TAG_TO_LABEL[trimmed] ?? trimmed,
        })
      })
    }

    const providerType = sp.get("providerType")
      if (providerType && providerType !== "all") {
      chips.push({
        key: `providerType:${providerType}`,
        param: "providerType",
        value: providerType,
        label: providerType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      })
    }

    const programTypes = sp.get("programTypes")
      if (programTypes) {
      programTypes.split(",").forEach((p) => {
        const trimmed = p.trim()
        if (!trimmed) return
        chips.push({
          key: `programTypes:${trimmed}`,
          param: "programTypes",
          value: trimmed,
            label: trimmed.replace(/_/g, " "),
        })
      })
    }

    const curriculum = sp.get("curriculum")
      if (curriculum) {
      curriculum.split(",").forEach((c) => {
        const trimmed = c.trim()
        if (!trimmed) return
        chips.push({
          key: `curriculum:${trimmed}`,
          param: "curriculum",
          value: trimmed,
            label: trimmed.replace(/_/g, " "),
        })
      })
    }

    const minFee = sp.get("minFee")
    const maxFee = sp.get("maxFee")
    if (minFee || maxFee) {
      chips.push({
        key: `fees:${minFee ?? ""}-${maxFee ?? ""}`,
        param: "feeRange",
        label: `$${minFee ?? "0"} - $${maxFee ?? "3000"}+`,
      })
    }

    const availability = sp.get("availability")
    if (availability) {
      availability.split(",").forEach((a) => {
        const trimmed = a.trim()
        if (!trimmed) return
        const label =
          trimmed === "openings"
            ? "Openings available"
            : trimmed === "waitlist"
            ? "Waitlist"
            : trimmed === "full"
            ? "Currently full"
            : trimmed
        chips.push({
          key: `availability:${trimmed}`,
          param: "availability",
          value: trimmed,
          label,
        })
      })
    }

    const minRating = sp.get("minRating")
    if (minRating) {
      const parsedRating = Number(minRating)
      if (Number.isFinite(parsedRating)) {
        chips.push({
          key: `minRating:${minRating}`,
          param: "minRating",
          value: minRating,
          label: `${parsedRating.toFixed(1)}+ rating`,
        })
      }
    }

    const languages = sp.get("languages")
      if (languages) {
      languages.split(",").forEach((lang) => {
        const trimmed = lang.trim()
        if (!trimmed) return
        chips.push({
          key: `languages:${trimmed}`,
          param: "languages",
          value: trimmed,
            label: trimmed.replace(/_/g, " "),
        })
      })
    }

    const features = sp.get("features")
      if (features) {
      features.split(",").forEach((feat) => {
        const trimmed = feat.trim()
        if (!trimmed) return
        chips.push({
          key: `features:${trimmed}`,
          param: "features",
          value: trimmed,
            label: trimmed.replace(/_/g, " "),
        })
      })
    }

    const radius = sp.get("radius")
    if (radius) {
      chips.push({
        key: `radius:${radius}`,
        param: "radius",
        value: radius,
        label: `Within ${radius} km`,
      })
    }

    return chips
  }, [searchParams])

  const activeFilters = useMemo(() => buildActiveFilters(), [buildActiveFilters])

  const handleRemoveFilter = useCallback(
    (param: string, value?: string) => {
      const sp = new URLSearchParams(searchParams?.toString() ?? "")

      if (param === "feeRange") {
        sp.delete("minFee")
        sp.delete("maxFee")
      } else if (value) {
        const current = sp.get(param)
        if (current) {
          const remaining = current
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v && v !== value)
          if (remaining.length > 0) {
            sp.set(param, remaining.join(","))
          } else {
            sp.delete(param)
          }
        }
      } else {
        sp.delete(param)
      }

      const query = sp.toString()
      router.push(query ? `/search?${query}` : "/search")
    },
    [router, searchParams],
  )

  const handleFilterChange = useCallback(
    (filters: FilterState) => {
      const sp = new URLSearchParams(searchParams?.toString() ?? "")

      const ageLabelToTag: Record<string, string> = {
        "Infant (0-12 months)": "infant",
        "Toddler (1-2 years)": "toddler",
        "Preschool (3-4 years)": "preschool",
        "Pre-K (4-5 years)": "prek",
        "School Age (5+)": "schoolage",
      }
      const ageTags = filters.ageGroups
        .map((label) => ageLabelToTag[label])
        .filter(Boolean)

      if (ageTags.length > 0) {
        sp.set("ageGroups", ageTags.join(","))
      } else {
        sp.delete("ageGroups")
      }

      if (filters.tuitionRange && filters.tuitionRange.length === 2) {
        sp.set("minFee", String(filters.tuitionRange[0]))
        sp.set("maxFee", String(filters.tuitionRange[1]))
      } else {
        sp.delete("minFee")
        sp.delete("maxFee")
      }

      if (filters.programTypes.length > 0) {
        sp.set("programTypes", filters.programTypes.join(","))
      } else {
        sp.delete("programTypes")
      }

      if (filters.languages.length > 0) {
        sp.set("languages", filters.languages.join(","))
      } else {
        sp.delete("languages")
      }

      if (filters.features.length > 0) {
        sp.set("features", filters.features.join(","))
      } else {
        sp.delete("features")
      }

      if (filters.curriculumTypes.length > 0) {
        sp.set("curriculum", filters.curriculumTypes.join(","))
      } else {
        sp.delete("curriculum")
      }

      if (filters.availability.length > 0) {
        sp.set("availability", filters.availability.join(","))
      } else {
        sp.delete("availability")
      }

      if (filters.minRating) {
        sp.set("minRating", String(filters.minRating))
      } else {
        sp.delete("minRating")
      }

      const query = sp.toString()
      router.push(query ? `/search?${query}` : "/search")
    },
    [router, searchParams],
  )

  const handleLoadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, providers.length))
  }, [providers.length])

  const visibleProviders = useMemo(
    () => providers.slice(0, visibleCount),
    [providers, visibleCount],
  )
  const isAllLoaded = visibleCount >= providers.length

  return (
    <div className="min-h-screen bg-background">
      {/* Top Search Bar */}
      <section className="bg-card border-b border-border py-4">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SearchBar variant="compact" />
        </div>
      </section>

      {/* Results Header */}
      <section className="bg-muted/30 py-4 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Childcare Near You
              </h1>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                Showing {providers.length} providers
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar filterOptions={filterOptions} onFilterChange={handleFilterChange} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.key}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleRemoveFilter(filter.param, filter.value)}
                >
                  {filter.label}
                  <span className="ml-1 text-muted-foreground">×</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex gap-6 lg:gap-8">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24">
                <FilterSidebar filterOptions={filterOptions} onFilterChange={handleFilterChange} />
              </div>
            </div>

            {/* Results + Map */}
            <div className="min-w-0 flex-1 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">Providers</h2>
                <p className="text-sm text-muted-foreground">
                  Showing {Math.min(visibleCount, providers.length)} of {providers.length}
                </p>
              </div>

              <SearchMapPanel providers={providers} />

              <div className="space-y-5">
                {visibleProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} layout="horizontal" />
                ))}
              </div>

              {providers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                  <h3 className="text-base font-semibold text-foreground">No providers found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting filters or increasing your search radius.
                  </p>
                </div>
              )}

              {/* Load More */}
              {!isAllLoaded && (
                <div className="mt-10 text-center">
                  <Button variant="outline" size="lg" onClick={handleLoadMore}>
                    Load More Providers
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

