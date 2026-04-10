"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { MessageSquare, Star, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type SearchResult = {
  inquiries: Array<{
    id: string
    parent_display_name: string | null
    parent_email: string | null
    inquiry_subject: string | null
    updated_at: string
    lead_status: string
  }>
  guestInquiries: Array<{
    id: string
    first_name: string
    last_name: string
    email: string
    created_at: string
  }>
  reviews: Array<{
    id: string
    parent_display_name: string | null
    review_text: string
    rating: number
    created_at: string
  }>
}

function formatDate(s: string): string {
  const d = new Date(s)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - itemDay.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0)
    return `Today · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" })
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
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

export default function ProviderSearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q")?.trim() ?? ""
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    const fetchSearchResults = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/provider/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResult({
          inquiries: data.inquiries ?? [],
          guestInquiries: data.guestInquiries ?? [],
          reviews: data.reviews ?? [],
        })
      } catch {
        setResult({ inquiries: [], guestInquiries: [], reviews: [] })
      } finally {
        setLoading(false)
      }
    }
    void fetchSearchResults()
  }, [q])

  const hasResults =
    q.length > 0 &&
    result &&
    (result.inquiries.length > 0 || result.guestInquiries.length > 0 || result.reviews.length > 0)
  const hasNoResults = result && !hasResults && q.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Search</h1>
        <p className="text-muted-foreground">
          Search across inquiries and reviews
          {q && (
            <span className="ml-1 font-medium text-foreground">
              , &ldquo;{q}&rdquo;
            </span>
          )}
        </p>
      </div>

      {!q && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="font-medium text-foreground">Enter a search term</p>
            <p className="mt-1 text-sm">
              Use the search bar above to find inquiries by parent name, email, or subject , and
              reviews by parent name or review text.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {hasNoResults && (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="font-medium text-foreground">No results found</p>
            <p className="mt-1 text-sm">
              No inquiries or reviews match &ldquo;{q}&rdquo;. Try a different search term.
            </p>
          </CardContent>
        </Card>
      )}

      {hasResults && result && (
        <div className="space-y-6">
          {(result.inquiries.length > 0 || result.guestInquiries.length > 0) && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Inquiries
                </CardTitle>
                <CardDescription>
                  {result.inquiries.length + result.guestInquiries.length} result
                  {result.inquiries.length + result.guestInquiries.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.inquiries.map((i) => (
                  <Link
                    key={i.id}
                    href={`/dashboard/provider/inquiries?open=${i.id}`}
                    className="block rounded-lg border border-border/50 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {i.parent_display_name?.trim() || "Parent"}
                        </p>
                        {i.parent_email && (
                          <p className="text-sm text-muted-foreground truncate">{i.parent_email}</p>
                        )}
                        {i.inquiry_subject && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {i.inquiry_subject}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs">
                          {i.lead_status ?? "new"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(i.updated_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
                {result.guestInquiries.map((g) => (
                  <Link
                    key={g.id}
                    href={`/dashboard/provider/inquiries?open=${g.id}`}
                    className="block rounded-lg border border-border/50 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {`${g.first_name} ${g.last_name}`.trim() || "Guest"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{g.email}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <Badge variant="secondary" className="text-xs">
                          Contact request
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(g.created_at)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {result.reviews.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  Reviews
                </CardTitle>
                <CardDescription>
                  {result.reviews.length} result{result.reviews.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.reviews.map((r) => (
                  <Link
                    key={r.id}
                    href="/dashboard/provider/reviews"
                    className="block rounded-lg border border-border/50 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">
                            {r.parent_display_name ?? "Anonymous"}
                          </p>
                          <StarRating rating={r.rating} />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{r.review_text}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
