"use client"

import { useState } from "react"
import { Star, MessageSquare, Flag, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const reviews = [
  {
    id: 1,
    parentName: "Sarah Johnson",
    rating: 5,
    date: "March 5, 2026",
    text: "We absolutely love Sunshine Daycare! The staff is incredibly caring and attentive. My daughter has learned so much and always comes home excited about her day. The daily updates through the app are wonderful.",
    reply: null,
    initials: "SJ"
  },
  {
    id: 2,
    parentName: "Michael Chen",
    rating: 5,
    date: "February 28, 2026",
    text: "Excellent preschool program! The curriculum is well-structured and age-appropriate. Our son has developed great social skills and loves going to school every day.",
    reply: "Thank you so much for your kind words, Michael! We're thrilled that your son is enjoying his time with us. Our teachers work hard to create engaging learning experiences.",
    initials: "MC"
  },
  {
    id: 3,
    parentName: "Emily Williams",
    rating: 4,
    date: "February 15, 2026",
    text: "Great facility with wonderful teachers. The outdoor play area is fantastic. Only giving 4 stars because drop-off can sometimes be a bit hectic during peak hours.",
    reply: null,
    initials: "EW"
  },
  {
    id: 4,
    parentName: "David Martinez",
    rating: 5,
    date: "February 1, 2026",
    text: "We've been with Sunshine for 2 years now and couldn't be happier. The Montessori-inspired approach really works for our daughter. The teachers genuinely care about each child's development.",
    reply: "Thank you, David! It's been a pleasure watching your daughter grow and learn with us over the past two years. We're honored to be part of your family's journey!",
    initials: "DM"
  },
  {
    id: 5,
    parentName: "Jessica Brown",
    rating: 5,
    date: "January 20, 2026",
    text: "The infant care program is exceptional. As first-time parents, we were nervous about daycare, but the staff made us feel completely at ease. They send photos and updates throughout the day.",
    reply: null,
    initials: "JB"
  },
]

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

function ReviewCard({ review }: { review: typeof reviews[0] }) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState("")

  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {review.initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
              <span className="font-medium text-foreground">{review.parentName}</span>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} />
                <span className="text-sm text-muted-foreground">{review.date}</span>
              </div>
            </div>

            <p className="text-foreground leading-relaxed mb-4">{review.text}</p>

            {/* Existing reply */}
            {review.reply && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">Your Reply</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{review.reply}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!review.reply && (
                <Collapsible open={showReplyForm} onOpenChange={setShowReplyForm}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Reply
                      <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showReplyForm ? "rotate-180" : ""}`} />
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
                      <div className="flex gap-2">
                        <Button size="sm" disabled={!replyText.trim()}>
                          Post Reply
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Flag className="h-4 w-4 mr-2" />
                Report
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReviewsPage() {
  const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-muted-foreground">Manage and respond to parent reviews</p>
      </div>

      {/* Stats */}
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
            <span className="text-3xl font-bold text-foreground">
              {Math.round((reviews.filter(r => r.reply).length / reviews.length) * 100)}%
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
