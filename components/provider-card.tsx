import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, Banknote, Tags, BadgeCheck, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EarlyLearningExcellenceBadge } from "@/components/early-learning-excellence-badge"
import { VerifiedProviderBadge } from "@/components/verified-provider-badge"
import type { Provider } from "@/lib/mock-data"

const TOP_RATED_MIN_RATING = 4.5
const TOP_RATED_MIN_REVIEWS = 10
const PARENT_FAVOURITE_MIN_SAVES = 2
const DESCRIPTION_MAX_LENGTH = 150

function isTopRated(provider: { rating: number; reviewCount: number }): boolean {
  const rating = Number(provider.rating)
  const reviewCount = Number(provider.reviewCount ?? 0)
  return rating >= TOP_RATED_MIN_RATING && reviewCount >= TOP_RATED_MIN_REVIEWS
}

function isParentFavourite(provider: { savedByParentCount?: number }): boolean {
  return (provider.savedByParentCount ?? 0) >= PARENT_FAVOURITE_MIN_SAVES
}

function truncateDescription(text: string): string {
  if (!text?.trim()) return ""
  const trimmed = text.trim()
  if (trimmed.length <= DESCRIPTION_MAX_LENGTH) return trimmed
  const cut = trimmed.slice(0, DESCRIPTION_MAX_LENGTH)
  const lastSpace = cut.lastIndexOf(" ")
  const end = lastSpace > 100 ? lastSpace : DESCRIPTION_MAX_LENGTH
  return cut.slice(0, end).trim() + "...more"
}

export type ProviderCardData = Pick<
  Provider,
  | "id"
  | "slug"
  | "name"
  | "rating"
  | "reviewCount"
  | "location"
  | "priceRange"
  | "providerTypes"
  | "programTypes"
  | "shortDescription"
  | "image"
  | "latitude"
  | "longitude"
  | "address"
> & {
  featured?: boolean
  earlyLearningExcellenceBadge?: boolean
  verifiedProviderBadge?: boolean
  verifiedProviderBadgeColor?: string | null
  savedByParentCount?: number
}

interface ProviderCardProps {
  provider: ProviderCardData
  featured?: boolean
  layout?: "grid" | "horizontal"
}

export function ProviderCard({ provider, featured = false, layout = "grid" }: ProviderCardProps) {
  if (layout === "horizontal") {
    return (
      <Card className="group overflow-hidden rounded-2xl border-border/60 bg-card p-0 gap-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30">
        {featured && (
          <div className="flex items-center px-4 py-2.5 bg-primary">
            <span className="inline-flex items-center gap-2 text-primary-foreground">
              <BadgeCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="text-sm font-medium">Featured</span>
            </span>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="flex flex-col shrink-0 md:w-72 lg:w-80 md:min-h-0">
            <div className="relative h-56 w-full overflow-hidden md:h-64 shrink-0">
              <Image
                src={provider.image}
                alt={provider.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            {(isTopRated(provider) || isParentFavourite(provider) || provider.earlyLearningExcellenceBadge || provider.verifiedProviderBadge) && (
              <>
                <div className="flex-1 min-h-0 hidden md:block" aria-hidden />
                <div className="flex flex-row flex-wrap items-center justify-center gap-2 px-3 py-2.5">
                  {provider.verifiedProviderBadge && (
                    <VerifiedProviderBadge size="sm" color={provider.verifiedProviderBadgeColor} />
                  )}
                  {provider.earlyLearningExcellenceBadge && (
                    <EarlyLearningExcellenceBadge size="sm" />
                  )}
                  {isTopRated(provider) && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50 border border-pink-200/70 dark:border-pink-700/40 px-3 py-1.5 text-xs font-semibold text-pink-700 dark:text-pink-300 shadow-sm ring-1 ring-pink-100/50 dark:ring-pink-800/30">
                      <Star className="h-4 w-4 fill-amber-500 dark:fill-amber-400" />
                      Top Rated
                    </span>
                  )}
                  {isParentFavourite(provider) && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 border border-violet-200/70 dark:border-violet-700/40 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 shadow-sm ring-1 ring-violet-100/50 dark:ring-violet-800/30">
                      <Heart className="h-4 w-4 fill-violet-500 dark:fill-violet-400" />
                      Parent Favourite
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <CardContent className="flex flex-1 flex-col p-5 md:p-6 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-xl font-semibold text-foreground leading-tight line-clamp-2">{provider.name}</h3>
              <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span className="font-semibold text-foreground">{provider.rating}</span>
                <span className="text-muted-foreground">({provider.reviewCount})</span>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{provider.location}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Banknote className="h-4 w-4 shrink-0" />
                <span>Daily: {provider.priceRange}</span>
              </p>
            </div>

            {provider.providerTypes.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Tags className="h-3.5 w-3.5 shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {provider.providerTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-[10px] font-medium">
                      {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {provider.programTypes.slice(0, 3).map((type) => (
                <Badge key={type} variant="secondary" className="text-xs font-normal">
                  {type}
                </Badge>
              ))}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {truncateDescription(provider.shortDescription)}
            </p>

            <div className="mt-5 md:mt-auto md:pt-2">
              <Button asChild className="w-full min-w-36 bg-primary hover:bg-primary/90 sm:w-auto">
                <Link href={`/providers/${provider.slug}`}>More details</Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
      <Card
      className={`overflow-hidden rounded-2xl border-border/60 bg-card p-0 gap-0 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 ${featured ? "border-primary/40" : ""}`}
    >
      {featured && (
        <div className="flex items-center px-4 py-2.5 bg-primary">
          <span className="inline-flex items-center gap-2 text-primary-foreground">
            <BadgeCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="text-sm font-medium">Featured</span>
          </span>
        </div>
      )}
      <div className="flex flex-col">
        <div className="relative aspect-4/3 overflow-hidden">
          <Image
            src={provider.image}
            alt={provider.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        {(isTopRated(provider) || isParentFavourite(provider) || provider.earlyLearningExcellenceBadge || provider.verifiedProviderBadge) && (
          <div className="flex flex-row flex-wrap items-center justify-center gap-2 px-3 py-2">
            {provider.verifiedProviderBadge && (
              <VerifiedProviderBadge size="sm" color={provider.verifiedProviderBadgeColor} />
            )}
            {provider.earlyLearningExcellenceBadge && (
              <EarlyLearningExcellenceBadge size="sm" />
            )}
            {isTopRated(provider) && (
              <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50 border border-pink-200/70 dark:border-pink-700/40 px-3 py-1.5 text-xs font-semibold text-pink-700 dark:text-pink-300 shadow-sm ring-1 ring-pink-100/50 dark:ring-pink-800/30">
                <Star className="h-4 w-4 fill-amber-500 dark:fill-amber-400" />
                Top Rated
              </span>
            )}
            {isParentFavourite(provider) && (
              <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 border border-violet-200/70 dark:border-violet-700/40 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 shadow-sm ring-1 ring-violet-100/50 dark:ring-violet-800/30">
                <Heart className="h-4 w-4 fill-violet-500 dark:fill-violet-400" />
                Parent Favourite
              </span>
            )}
          </div>
        )}
      </div>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1">{provider.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-4 w-4 fill-secondary text-secondary" />
            <span className="text-sm font-medium">{provider.rating}</span>
            <span className="text-sm text-muted-foreground">({provider.reviewCount})</span>
          </div>
        </div>

        {provider.providerTypes.length > 0 && (
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <Tags className="h-3 w-3 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {provider.providerTypes.map((type) => (
                <Badge key={type} variant="outline" className="text-[10px] font-medium">
                  {type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{provider.location}</span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <Banknote className="h-4 w-4 shrink-0" />
          <span>Daily: {provider.priceRange}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {provider.programTypes.slice(0, 3).map((type) => (
            <Badge key={type} variant="secondary" className="text-xs font-normal">
              {type}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {truncateDescription(provider.shortDescription)}
        </p>

        <Button asChild className="w-full bg-primary hover:bg-primary/90">
          <Link href={`/providers/${provider.slug}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
