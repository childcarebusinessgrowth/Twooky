import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, DollarSign, Tags } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Provider } from "@/lib/mock-data"

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
>

interface ProviderCardProps {
  provider: ProviderCardData
  featured?: boolean
  layout?: "grid" | "horizontal"
}

export function ProviderCard({ provider, featured = false, layout = "grid" }: ProviderCardProps) {
  if (layout === "horizontal") {
    return (
      <Card className="group overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30">
        <div className="flex flex-col md:flex-row">
          <div className="relative h-56 w-full overflow-hidden md:h-auto md:w-72 lg:w-80">
            <Image
              src={provider.image}
              alt={provider.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {featured && (
              <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">Featured</Badge>
            )}
          </div>

          <CardContent className="flex flex-1 flex-col p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-xl font-semibold text-foreground leading-tight line-clamp-2">{provider.name}</h3>
              <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span className="font-semibold text-foreground">{provider.rating}</span>
                <span className="text-muted-foreground">({provider.reviewCount})</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{provider.location}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 shrink-0" />
                <span>{provider.priceRange}</span>
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

            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {provider.shortDescription}
            </p>

            <div className="mt-5">
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
      className={`overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 ${featured ? "border-primary/40" : ""}`}
    >
      <div className="relative aspect-4/3 overflow-hidden">
        <Image
          src={provider.image}
          alt={provider.name}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
        {featured && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
            Featured
          </Badge>
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
          <DollarSign className="h-4 w-4 shrink-0" />
          <span>{provider.priceRange}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {provider.programTypes.slice(0, 3).map((type) => (
            <Badge key={type} variant="secondary" className="text-xs font-normal">
              {type}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {provider.shortDescription}
        </p>

        <Button asChild className="w-full bg-primary hover:bg-primary/90">
          <Link href={`/providers/${provider.slug}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
