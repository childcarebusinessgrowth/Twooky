"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, Star, Building2, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AdminReviewRow } from "@/lib/admin-dashboard"

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  )
}

function getInitials(displayName: string | null): string {
  if (displayName?.trim()) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }
  return "?"
}

type ReviewCardProps = {
  review: AdminReviewRow
}

function ReviewCard({ review }: ReviewCardProps) {
  const initials = getInitials(review.parent_display_name ?? "Anonymous")
  const parentName = review.parent_display_name?.trim() || "Anonymous"
  const providerName = review.provider_business_name?.trim() || "Unknown provider"
  const hasReply = Boolean(review.provider_reply_text?.trim())

  return (
    <Card className="group border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12 shrink-0 border-2 border-background shadow-md ring-1 ring-border/50">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
              <div>
                <p className="font-semibold text-foreground">{parentName}</p>
                <div className="mt-1">
                  {review.provider_slug ? (
                    <Link
                      href={`/providers/${review.provider_slug}`}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      {providerName}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      {providerName}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StarRating rating={review.rating} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(review.created_at)}
                </span>
              </div>
            </div>

            <p className="text-foreground leading-relaxed text-sm">{review.review_text}</p>

            {hasReply && (
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Provider Reply
                  </Badge>
                  {review.provider_replied_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.provider_replied_at)}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.provider_reply_text}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type Props = {
  initialReviews: AdminReviewRow[]
  loadError: string | null
}

export function AdminReviewsClient({ initialReviews, loadError }: Props) {
  const [search, setSearch] = useState("")
  const [providerFilter, setProviderFilter] = useState<string>("all")

  const uniqueProviders = useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of initialReviews) {
      const id = r.provider_profile_id
      const name = r.provider_business_name?.trim() || "Unknown"
      if (!seen.has(id)) seen.set(id, name)
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [initialReviews])

  const filteredReviews = useMemo(() => {
    let list = initialReviews

    if (providerFilter !== "all") {
      list = list.filter((r) => r.provider_profile_id === providerFilter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          (r.parent_display_name?.toLowerCase().includes(q) ?? false) ||
          (r.provider_business_name?.toLowerCase().includes(q) ?? false) ||
          r.review_text.toLowerCase().includes(q)
      )
    }

    return list
  }, [initialReviews, providerFilter, search])

  const stats = useMemo(() => {
    const total = initialReviews.length
    const avgRating =
      total > 0
        ? (initialReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
        : "0"
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const newThisMonth = initialReviews.filter(
      (r) => new Date(r.created_at) >= start
    ).length

    return { total, avgRating, newThisMonth }
  }, [initialReviews])

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground">
            All parent reviews across providers
          </p>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-destructive font-medium">Could not load reviews</p>
            <p className="text-sm text-muted-foreground mt-1">{loadError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/12 via-primary/6 to-transparent border border-primary/10 p-6 sm:p-8">
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Reviews
              </h1>
              <p className="mt-1 text-muted-foreground">
                All parent reviews across providers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="gap-1.5 px-3 py-1.5 text-sm font-medium"
              >
                <MessageSquare className="h-4 w-4" />
                {stats.total} total
              </Badge>
              {stats.newThisMonth > 0 && (
                <Badge className="gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary/90">
                  <Star className="h-4 w-4" />
                  {stats.newThisMonth} new this month
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-foreground">
              {stats.total}
            </span>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Average Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-foreground">
                {stats.avgRating}
              </span>
              <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>New This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-foreground">
              {stats.newThisMonth}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by parent, provider, or review text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl border-border/60 bg-background/80"
          />
        </div>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-full sm:w-[220px] h-11 rounded-xl border-border/60">
            <SelectValue placeholder="Filter by provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            {uniqueProviders.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Review cards */}
      {filteredReviews.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium text-foreground">
              {search.trim() || providerFilter !== "all"
                ? "No reviews match your filters"
                : "No reviews yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {search.trim() || providerFilter !== "all"
                ? "Try adjusting your search or provider filter."
                : "Parent reviews will appear here once they are submitted."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}
