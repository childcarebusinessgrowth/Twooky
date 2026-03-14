import Link from "next/link"
import { Star, Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Review } from "@/lib/mock-data"

interface ReviewCardProps {
  review: Review
  showProvider?: boolean
}

export function ReviewCard({ review, showProvider = true }: ReviewCardProps) {
  const initials = review.parentName.split(' ').map(n => n[0]).join('')
  const formattedDate = new Date(review.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 bg-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
              <div>
                <h4 className="font-semibold text-foreground">{review.parentName}</h4>
                {showProvider && (
                  <Link 
                    href={`/providers/${review.providerId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {review.providerName}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative">
              <Quote className="absolute -left-1 -top-1 h-6 w-6 text-primary/20" />
              <p className="text-muted-foreground leading-relaxed pl-5">
                {review.text}
              </p>
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              {formattedDate}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
