import { RequireAuth } from "@/components/RequireAuth"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, CalendarClock, Globe2 } from "lucide-react"

type ComparisonProvider = {
  id: number
  name: string
  rating: number
  tuitionRange: string
  ageGroups: string
  curriculum: string
  hours: string
  languages: string
  distance: string
}

const comparisonProviders: ComparisonProvider[] = [
  {
    id: 1,
    name: "Sunrise Montessori Preschool",
    rating: 4.9,
    tuitionRange: "$1,250–$1,550 / mo",
    ageGroups: "Toddlers · Preschool",
    curriculum: "Montessori, play-based learning",
    hours: "7:30 AM – 5:30 PM",
    languages: "English",
    distance: "1.2 mi",
  },
  {
    id: 2,
    name: "Little Oaks Learning Center",
    rating: 4.8,
    tuitionRange: "$1,050–$1,400 / mo",
    ageGroups: "Infants · Toddlers · Preschool",
    curriculum: "Reggio-inspired, project-based",
    hours: "7:00 AM – 6:00 PM",
    languages: "English, Spanish",
    distance: "2.5 mi",
  },
  {
    id: 3,
    name: "Greenway Nature Preschool",
    rating: 4.7,
    tuitionRange: "$1,100–$1,450 / mo",
    ageGroups: "Preschool",
    curriculum: "Nature immersion, emergent",
    hours: "8:00 AM – 3:30 PM",
    languages: "English",
    distance: "3.1 mi",
  },
]

export default function ParentComparePage() {
  return (
    <RequireAuth>
      <div className="space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            Compare providers
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            See your top choices side by side. Look at rating, tuition, curriculum, and hours to
            find the best fit for your family.
          </p>
        </div>

        <Card className="border-none bg-primary/10 rounded-3xl shadow-sm shadow-primary/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 lg:p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Not seeing something important?
              </p>
              <p className="text-xs text-muted-foreground">
                Click into a provider to read full details like licensing, health &amp; safety
                notes, and photos.
              </p>
            </div>
            <Button size="sm" variant="outline" className="rounded-full border-border/60" asChild>
              <Link href="/dashboard/parent/saved">
                Adjust compare list
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[140px,repeat(3,minmax(0,1fr))] gap-3 text-xs lg:text-sm">
              {/* Header row */}
              <div />
              {comparisonProviders.map((provider) => (
                <Card
                  key={provider.id}
                  className="border border-border/60 bg-card rounded-3xl shadow-sm"
                >
                  <CardHeader className="space-y-2 pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground line-clamp-2">
                      {provider.name}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                        {provider.rating.toFixed(1)} rating
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {provider.distance}
                      </span>
                    </CardDescription>
                    <Badge
                      variant="outline"
                      className="w-fit rounded-full border-border/60 bg-muted/50 text-[11px] text-muted-foreground"
                    >
                      {provider.ageGroups}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-full border-border/60 text-xs text-muted-foreground"
                      asChild
                    >
                      <Link href="/search">
                        View full profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Rows */}
              <div className="mt-4 space-y-3 text-[11px] text-muted-foreground">
                <div className="font-medium text-foreground">Rating</div>
                <div className="font-medium text-foreground">Tuition range</div>
                <div className="font-medium text-foreground">Age groups</div>
                <div className="font-medium text-foreground">Curriculum</div>
                <div className="font-medium text-foreground">Hours</div>
                <div className="font-medium text-foreground flex items-center gap-1">
                  <Globe2 className="h-3.5 w-3.5" />
                  Languages
                </div>
              </div>

              {comparisonProviders.map((provider) => (
                <Card
                  key={`details-${provider.id}`}
                  className="mt-4 border border-border/60 bg-card rounded-3xl shadow-sm"
                >
                  <CardContent className="space-y-3 py-3 text-[11px] lg:text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                      <span className="font-medium">{provider.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">/ 5.0</span>
                    </div>
                    <div className="font-medium text-foreground">
                      {provider.tuitionRange}
                    </div>
                    <div>{provider.ageGroups}</div>
                    <div>{provider.curriculum}</div>
                    <div className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5 text-secondary" />
                      <span>{provider.hours}</span>
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <Globe2 className="h-3.5 w-3.5 text-primary" />
                      <span>{provider.languages}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}

