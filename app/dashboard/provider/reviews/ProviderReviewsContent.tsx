"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star, MessageSquare, Flag, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { addProviderReply, createReviewReport } from "@/lib/parent-engagement"
import type { PublicReviewRow } from "@/lib/parent-engagement"

const REPORT_REASONS = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "fake", label: "Suspected fake or misleading review" },
  { value: "other", label: "Other" },
] as const

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

type ReviewCardProps = {
  review: PublicReviewRow
  providerProfileId: string
}

function ReviewCard({ review, providerProfileId }: ReviewCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<string>("")
  const [reportDetails, setReportDetails] = useState("")
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportSuccess, setReportSuccess] = useState(false)

  const initials = (review.parent_display_name ?? "Anonymous")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"
  const dateStr = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const hasReply = Boolean(review.provider_reply_text?.trim())

  const handlePostReply = async () => {
    if (!replyText.trim()) return
    setReplyError(null)
    setReplyLoading(true)
    const { error } = await addProviderReply(
      getSupabaseClient(),
      review.id,
      providerProfileId,
      replyText
    )
    setReplyLoading(false)
    if (error) {
      setReplyError(error)
      return
    }
    setShowReplyForm(false)
    setReplyText("")
    toast({ title: "Reply posted", variant: "success" })
    router.refresh()
  }

  const handleOpenReport = () => {
    setReportOpen(true)
    setReportReason("")
    setReportDetails("")
    setReportError(null)
    setReportSuccess(false)
  }

  const handleSubmitReport = async () => {
    const reasonLabel = REPORT_REASONS.find((r) => r.value === reportReason)?.label ?? reportReason
    if (!reasonLabel.trim()) {
      setReportError("Please select a reason.")
      return
    }
    setReportError(null)
    setReportLoading(true)
    const { error } = await createReviewReport(
      getSupabaseClient(),
      review.id,
      providerProfileId,
      reasonLabel,
      reportDetails.trim() || null
    )
    setReportLoading(false)
    if (error) {
      setReportError(error)
      return
    }
    setReportSuccess(true)
    toast({ title: "Report submitted", variant: "success" })
    setTimeout(() => {
      setReportOpen(false)
    }, 800)
  }

  return (
    <>
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                <span className="font-medium text-foreground">
                  {review.parent_display_name ?? "Anonymous"}
                </span>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-sm text-muted-foreground">{dateStr}</span>
                </div>
              </div>

              <p className="text-foreground leading-relaxed mb-4">{review.review_text}</p>

              {hasReply && (
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Your Reply
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.provider_reply_text}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!hasReply && (
                  <Collapsible open={showReplyForm} onOpenChange={setShowReplyForm}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Reply
                        <ChevronDown
                          className={`h-4 w-4 ml-2 transition-transform ${showReplyForm ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Write your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                        />
                        {replyError && (
                          <p className="text-sm text-destructive">{replyError}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={!replyText.trim() || replyLoading}
                            onClick={() => void handlePostReply()}
                          >
                            {replyLoading ? "Posting..." : "Post Reply"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowReplyForm(false)
                              setReplyError(null)
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={handleOpenReport}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this review</DialogTitle>
            <DialogDescription>
              Your report will be saved for review. It will not remove the review from your
              dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (required)</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional details (optional)</label>
              <Textarea
                placeholder="Provide any additional context..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
              />
            </div>
            {reportError && (
              <p className="text-sm text-destructive">{reportError}</p>
            )}
            {reportSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400">Report submitted. Thank you.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmitReport()}
              disabled={!reportReason.trim() || reportLoading}
            >
              {reportLoading ? "Submitting..." : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type ProviderReviewsContentProps = {
  providerProfileId: string
  reviews: PublicReviewRow[]
}

export function ProviderReviewsContent({
  providerProfileId,
  reviews,
}: ProviderReviewsContentProps) {
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "0"
  const responseRate =
    reviews.length > 0
      ? Math.round(
          (reviews.filter((r) => r.provider_reply_text?.trim()).length / reviews.length) * 100
        )
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-muted-foreground">Manage and respond to parent reviews</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Average Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-foreground">{averageRating}</span>
              <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-foreground">{reviews.length}</span>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Response Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-foreground">{responseRate}%</span>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              providerProfileId={providerProfileId}
            />
          ))
        ) : (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p className="font-medium text-foreground">No reviews yet</p>
              <p className="mt-1 text-sm">
                When parents leave reviews, they will appear here. You can reply and manage them.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
