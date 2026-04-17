import { Suspense } from "react"
import { getAdminListings, getAdminListingCountries, getActiveDirectoryBadges } from "./actions"
import { AdminListingsTable } from "./AdminListingsTable"

const PAGE_SIZE = 10

type PageProps = {
  searchParams: Promise<{
    page?: string
    status?: string
    country?: string
    search?: string
    featured?: string
    rating?: string
    reviews?: string
  }>
}

export default async function AdminListingsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const statusFilter =
    params.status === "active" || params.status === "pending" || params.status === "inactive"
      ? params.status
      : "all"
  const countryFilter = params.country?.trim() ?? ""
  const searchQuery = params.search?.trim() ?? ""
  const featuredFilter =
    params.featured === "yes" || params.featured === "no" ? params.featured : "all"
  const ratingParam = params.rating?.trim()
  const ratingFilter =
    ratingParam === "none" || ratingParam === "2" || ratingParam === "3" || ratingParam === "4"
      ? ratingParam
      : "all"
  const reviewsParam = params.reviews?.trim()
  const reviewsFilter =
    reviewsParam === "none" || reviewsParam === "1" || reviewsParam === "5" || reviewsParam === "10"
      ? reviewsParam
      : "all"

  const minRating =
    ratingFilter === "2" || ratingFilter === "3" || ratingFilter === "4"
      ? parseInt(ratingFilter, 10)
      : undefined
  const minReviews =
    reviewsFilter === "1" || reviewsFilter === "5" || reviewsFilter === "10"
      ? parseInt(reviewsFilter, 10)
      : undefined
  const reviewsFilterNone =
    reviewsFilter === "none" || ratingFilter === "none" ? ("none" as const) : undefined

  const [listingsResult, countries, availableBadges] = await Promise.all([
    getAdminListings({
      page,
      pageSize: PAGE_SIZE,
      status: statusFilter as "active" | "pending" | "inactive" | "all",
      search: searchQuery || undefined,
      countryId: countryFilter && countryFilter !== "all" ? countryFilter : undefined,
      featured: featuredFilter as "all" | "yes" | "no",
      minRating,
      minReviews,
      reviewsFilter: reviewsFilterNone,
    }),
    getAdminListingCountries(),
    getActiveDirectoryBadges(),
  ])

  return (
    <Suspense fallback={<div className="p-4">Loading listings…</div>}>
      <AdminListingsTable
        initialListings={listingsResult.listings}
        total={listingsResult.total}
        countries={countries}
        page={page}
        statusFilter={statusFilter}
        countryFilter={countryFilter}
        searchQuery={searchQuery}
        featuredFilter={featuredFilter}
        ratingFilter={ratingFilter}
        reviewsFilter={reviewsFilter}
        availableBadges={availableBadges}
      />
    </Suspense>
  )
}
