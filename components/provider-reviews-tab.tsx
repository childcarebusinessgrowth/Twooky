"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { ReviewCard } from "@/components/review-card"
import type { PublicReviewRow } from "@/lib/parent-engagement"
import { ProviderWriteReview } from "@/components/provider-write-review"

type Review = {
  id: string
  parentName: string
  providerName: string
  providerId: string
  rating: number
  text: string
  date: string
  providerReplyText: string | null
  providerRepliedAt: string | null
}

function mapToReview(row: PublicReviewRow, providerName: string, providerSlug: string): Review {
  return {
    id: row.id,
    parentName: row.parent_display_name ?? "Parent",
    providerName,
    providerId: providerSlug,
    rating: row.rating,
    text: row.review_text,
    date: row.created_at,
    providerReplyText: row.provider_reply_text,
    providerRepliedAt: row.provider_replied_at,
  }
}

type Props = {
  providerProfileId: string
  providerSlug: string
  providerName: string
  initialReviews: PublicReviewRow[]
}

export function ProviderReviewsTab({
  providerProfileId,
  providerSlug,
  providerName,
  initialReviews,
}: Props) {
  const router = useRouter()
  const reviews = initialReviews.map((r) => mapToReview(r, providerName, providerSlug))

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="font-semibold text-foreground">
          Parent Reviews ({reviews.length})
        </h3>
        <ProviderWriteReview
          providerProfileId={providerProfileId}
          providerSlug={providerSlug}
          providerName={providerName}
          onSubmitted={() => router.refresh()}
        />
      </div>
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} showProvider={false} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No reviews yet. Be the first to review this provider!
          </CardContent>
        </Card>
      )}
    </div>
  )
}
