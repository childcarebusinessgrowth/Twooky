"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { updateReview, deleteReview } from "@/lib/parent-engagement"
import type { ParentReviewRow } from "@/lib/parent-engagement"

function Stars({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < value ? "fill-secondary text-secondary" : "text-muted"
          }`}
        />
      ))}
    </div>
  )
}

type Props = {
  parentProfileId: string
  review: ParentReviewRow
}

export function ParentReviewCard({ parentProfileId, review }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(review.rating)
  const [text, setText] = useState(review.review_text)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const providerName = review.provider_business_name ?? "Provider"
  const providerHref = review.provider_slug
    ? `/providers/${review.provider_slug}`
    : "#"
  const dateStr = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handleSaveEdit = async () => {
    setError(null)
    setLoading(true)
    const { error: err } = await updateReview(
      getSupabaseClient(),
      review.id,
      parentProfileId,
      { rating, review_text: text }
    )
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    setEditing(false)
    router.refresh()
  }

  const handleDeleteConfirm = async () => {
    setLoading(true)
    const { error: err } = await deleteReview(
      getSupabaseClient(),
      review.id,
      parentProfileId
    )
    setLoading(false)
    if (!err) {
      setDeleteDialogOpen(false)
      router.refresh()
    }
  }

  return (
    <Card className="border border-border/60 bg-card rounded-3xl shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted flex items-center justify-center text-muted-foreground text-xs">
          Review
        </div>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-sm lg:text-base font-semibold text-foreground">
            {review.provider_slug ? (
              <Link href={providerHref} className="hover:underline">
                {providerName}
              </Link>
            ) : (
              providerName
            )}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>·</span>
            <span>{dateStr}</span>
          </CardDescription>
          {!editing && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
              <Stars value={review.rating} />
              <span className="ml-1">{review.rating} out of 5</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="p-0.5 focus:outline-none"
                  onClick={() => setRating(value)}
                  aria-label={`${value} stars`}
                >
                  <Star
                    className={`h-5 w-5 ${
                      value <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => void handleSaveEdit()}
                disabled={loading || !text.trim()}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  setEditing(false)
                  setRating(review.rating)
                  setText(review.review_text)
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs lg:text-sm leading-relaxed text-muted-foreground">
              {review.review_text}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full border-border/60"
                onClick={() => setEditing(true)}
              >
                Edit review
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-xs text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                Delete review
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete review?"
        description="This cannot be undone."
        itemName={providerName}
        variant="delete"
        onConfirm={handleDeleteConfirm}
      />
    </Card>
  )
}
