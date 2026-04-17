"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Search,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  Star as StarIcon,
  MapPin,
  Loader2,
  Plus,
  Award,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import type { AdminListingRow, AdminListingCountry } from "./actions"
import {
  updateListingStatus,
  updateListingFeatured,
  updateListingEarlyLearningExcellenceBadge,
  updateListingVerifiedProviderBadge,
  setListingDirectoryBadges,
  deleteListing,
  type ListingStatus,
} from "./actions"
import { VerifiedProviderBadge } from "@/components/verified-provider-badge"
import { DirectoryBadge } from "@/components/directory-badge"
import type { DirectoryBadgeView } from "@/lib/directory-badges"

const PAGE_SIZE = 10

type AdminListingsTableProps = {
  initialListings: AdminListingRow[]
  total: number
  countries: AdminListingCountry[]
  page: number
  statusFilter: string
  countryFilter: string
  searchQuery: string
  featuredFilter: string
  ratingFilter: string
  reviewsFilter: string
  availableBadges: DirectoryBadgeView[]
}

export function AdminListingsTable({
  initialListings: listings,
  total,
  countries,
  page,
  statusFilter,
  countryFilter,
  searchQuery,
  featuredFilter,
  ratingFilter,
  reviewsFilter,
  availableBadges,
}: AdminListingsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<{ profileId: string; name: string } | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [badgeDialogTarget, setBadgeDialogTarget] = useState<AdminListingRow | null>(null)
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>([])

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    const nextSearch = localSearch.trim()
    const currentSearch = searchParams.get("search")?.trim() ?? ""
    if (nextSearch === currentSearch) return

    const timeoutId = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString())
      next.set("page", "1")
      if (nextSearch) next.set("search", nextSearch)
      else next.delete("search")
      router.replace(`/admin/listings?${next.toString()}`, { scroll: false })
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [localSearch, router, searchParams])

  const toggleSelect = (profileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(profileId)) next.delete(profileId)
      else next.add(profileId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(listings.map((l) => l.profile_id)))
    }
  }

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "1")
    if (statusFilter !== "all") next.set("status", statusFilter)
    else next.delete("status")
    if (countryFilter && countryFilter !== "all") next.set("country", countryFilter)
    else next.delete("country")
    if (localSearch.trim()) next.set("search", localSearch.trim())
    else next.delete("search")
    if (featuredFilter !== "all") next.set("featured", featuredFilter)
    else next.delete("featured")
    if (ratingFilter !== "all") next.set("rating", ratingFilter)
    else next.delete("rating")
    if (reviewsFilter !== "all") next.set("reviews", reviewsFilter)
    else next.delete("reviews")
    router.push(`/admin/listings?${next.toString()}`)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setLocalSearch("")
    router.push("/admin/listings")
    setFiltersOpen(false)
  }

  const activeFilterCount =
    [statusFilter, countryFilter, featuredFilter, ratingFilter, reviewsFilter].filter(
      (v) => v && v !== "all"
    ).length + (localSearch.trim() ? 1 : 0)

  const setStatusFilter = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "1")
    if (value !== "all") next.set("status", value)
    else next.delete("status")
    router.push(`/admin/listings?${next.toString()}`)
  }

  const setCountryFilter = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "1")
    if (value && value !== "all") next.set("country", value)
    else next.delete("country")
    router.push(`/admin/listings?${next.toString()}`)
  }

  const setFeaturedFilter = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "1")
    if (value !== "all") next.set("featured", value)
    else next.delete("featured")
    router.push(`/admin/listings?${next.toString()}`)
  }

  const setRatingFilter = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "1")
    if (value !== "all") next.set("rating", value)
    else next.delete("rating")
    router.push(`/admin/listings?${next.toString()}`)
  }

  const setReviewsFilter = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "1")
    if (value !== "all") next.set("reviews", value)
    else next.delete("reviews")
    router.push(`/admin/listings?${next.toString()}`)
  }

  const goToPage = (newPage: number) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", String(newPage))
    router.push(`/admin/listings?${next.toString()}`)
  }

  const handleUpdateStatus = (profileId: string, status: ListingStatus) => {
    startTransition(async () => {
      await updateListingStatus(profileId, status)
      router.refresh()
    })
  }

  const handleToggleFeatured = (profileId: string, current: boolean) => {
    startTransition(async () => {
      await updateListingFeatured(profileId, !current)
      router.refresh()
    })
  }

  const handleToggleEarlyLearningExcellence = (
    profileId: string,
    current: boolean
  ) => {
    startTransition(async () => {
      await updateListingEarlyLearningExcellenceBadge(profileId, !current)
      router.refresh()
    })
  }

  const handleToggleVerifiedProvider = (profileId: string, current: boolean) => {
    startTransition(async () => {
      await updateListingVerifiedProviderBadge(profileId, !current)
      router.refresh()
    })
  }

  const handleDelete = (profileId: string) => {
    const listing = listings.find((l) => l.profile_id === profileId)
    setDeleteTarget({
      profileId,
      name: listing?.business_name ?? listing?.provider_slug ?? profileId,
    })
  }

  const openBadgeDialog = (listing: AdminListingRow) => {
    setBadgeDialogTarget(listing)
    setSelectedBadgeIds(listing.directory_badges.map((badge) => badge.id))
  }

  const toggleBadgeSelection = (badgeId: string) => {
    setSelectedBadgeIds((prev) =>
      prev.includes(badgeId) ? prev.filter((id) => id !== badgeId) : [...prev, badgeId]
    )
  }

  const saveListingBadges = () => {
    if (!badgeDialogTarget) return
    startTransition(async () => {
      await setListingDirectoryBadges(badgeDialogTarget.profile_id, selectedBadgeIds)
      setBadgeDialogTarget(null)
      router.refresh()
    })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      await deleteListing(deleteTarget.profileId)
      setDeleteTarget(null)
      router.refresh()
    })
  }

  const bulkFeature = () => {
    startTransition(async () => {
      for (const id of selectedIds) {
        await updateListingFeatured(id, true)
      }
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  const bulkDeactivate = () => {
    startTransition(async () => {
      for (const id of selectedIds) {
        await updateListingStatus(id, "inactive")
      }
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  const bulkDelete = () => {
    if (selectedIds.size === 0) return
    setBulkDeleteOpen(true)
  }

  const confirmBulkDelete = () => {
    if (selectedIds.size === 0) {
      setBulkDeleteOpen(false)
      return
    }
    startTransition(async () => {
      for (const id of selectedIds) {
        await deleteListing(id)
      }
      setSelectedIds(new Set())
      setBulkDeleteOpen(false)
      router.refresh()
    })
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Listings Management</h1>
        <p className="text-muted-foreground">View and manage all provider listings</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            className="pl-9"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-[440px] sm:w-[440px]">
              <SheetHeader className="px-8">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 py-4 px-8">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Country</label>
                  <Select value={countryFilter || "all"} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Featured</label>
                  <Select value={featuredFilter || "all"} onValueChange={setFeaturedFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Featured only</SelectItem>
                      <SelectItem value="no">Not featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Rating</label>
                  <Select value={ratingFilter || "all"} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="none">No rating</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Reviews</label>
                  <Select value={reviewsFilter || "all"} onValueChange={setReviewsFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="none">No reviews</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                      <SelectItem value="10">10+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-auto flex flex-col gap-2 border-t pt-4 pb-8 px-8">
                <Button onClick={applyFilters} disabled={isPending}>
                  Apply
                </Button>
                <Button variant="outline" onClick={clearFilters} disabled={isPending}>
                  Clear
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/listings/import")}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => router.push("/admin/listings/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button
            variant="outline"
            size="sm"
            onClick={bulkFeature}
            disabled={isPending}
          >
            Feature Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={bulkDeactivate}
            disabled={isPending}
          >
            Deactivate Selected
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={bulkDelete}
            disabled={isPending}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      listings.length > 0 && selectedIds.size === listings.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Reviews</TableHead>
                <TableHead className="hidden lg:table-cell">Rating</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No listings found.
                  </TableCell>
                </TableRow>
              ) : (
                listings.map((listing) => (
                  <TableRow key={listing.profile_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(listing.profile_id)}
                        onCheckedChange={() => toggleSelect(listing.profile_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {listing.primary_photo_url ? (
                          <div className="relative h-8 w-8 rounded overflow-hidden bg-muted shrink-0">
                            <Image
                              src={listing.primary_photo_url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ) : null}
                        <Link
                          href={`/admin/listings/${listing.profile_id}`}
                          className="font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                        >
                          {listing.business_name || listing.provider_slug || ","}
                        </Link>
                        {listing.featured && (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        )}
                        {listing.early_learning_excellence_badge && (
                          <Badge
                            variant="outline"
                            className="text-xs border-amber-300/70 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200"
                          >
                            Early Learning Excellence
                          </Badge>
                        )}
                        {listing.verified_provider_badge && (
                          <VerifiedProviderBadge
                            size="sm"
                            color={listing.verified_provider_badge_color}
                          />
                        )}
                        {listing.directory_badges.map((badge) => (
                          <DirectoryBadge key={badge.id} badge={badge} size="sm" />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground md:hidden flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {[listing.city, listing.address].filter(Boolean).join(", ") || ","}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {[listing.city, listing.address].filter(Boolean).join(", ") || ","}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={
                          listing.listing_status === "active"
                            ? "default"
                            : listing.listing_status === "pending"
                              ? "secondary"
                              : "outline"
                        }
                        className={
                          listing.listing_status === "active" ? "bg-primary" : ""
                        }
                      >
                        {listing.listing_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {listing.review_count}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {listing.rating != null ? (
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span>{listing.rating}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">,</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/listings/${listing.profile_id}/edit`)
                            }
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleFeatured(
                                listing.profile_id,
                                listing.featured
                              )
                            }
                            disabled={isPending}
                          >
                            <StarIcon className="h-4 w-4 mr-2" />
                            {listing.featured ? "Remove Feature" : "Feature"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleEarlyLearningExcellence(
                                listing.profile_id,
                                listing.early_learning_excellence_badge
                              )
                            }
                            disabled={isPending}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            {listing.early_learning_excellence_badge
                              ? "Remove Early Learning Excellence"
                              : "Assign Early Learning Excellence"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleVerifiedProvider(
                                listing.profile_id,
                                listing.verified_provider_badge
                              )
                            }
                            disabled={isPending}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            {listing.verified_provider_badge
                              ? "Remove Verified Provider"
                              : "Assign Verified Provider"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openBadgeDialog(listing)}
                            disabled={isPending}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Manage dynamic badges
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(listing.profile_id, "active")
                            }
                            disabled={isPending}
                          >
                            Set active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(listing.profile_id, "inactive")
                            }
                            disabled={isPending}
                          >
                            Set inactive
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(listing.profile_id, "pending")
                            }
                            disabled={isPending}
                          >
                            Set pending
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(listing.profile_id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {from}–{to} of {total} listings
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the listing &quot;{deleteTarget?.name}&quot; and all
              associated photos and reviews. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected listings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected{" "}
              {selectedIds.size === 1 ? "listing" : "listings"} and all associated
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Selected"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!badgeDialogTarget} onOpenChange={(open) => !open && setBadgeDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign badges</DialogTitle>
            <DialogDescription>
              Choose which dynamic badges are shown on this provider.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {availableBadges.map((badge) => (
              <label
                key={badge.id}
                className="flex items-center gap-3 rounded-md border border-border/60 p-2"
              >
                <Checkbox
                  checked={selectedBadgeIds.includes(badge.id)}
                  onCheckedChange={() => toggleBadgeSelection(badge.id)}
                />
                <DirectoryBadge badge={badge} size="sm" />
              </label>
            ))}
            {availableBadges.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No active badges available yet. Create them in Directory → Badges.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBadgeDialogTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={saveListingBadges} disabled={isPending}>
              Save badges
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
