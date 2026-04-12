import Link from "next/link"
import { MapPin, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { buildLocationHref } from "@/lib/locations"

interface CityCardProps {
  name: string
  state: string
  countryCode: string
  slug: string
  providerCount: number
}

export function CityCard({ name, state, countryCode, slug, providerCount }: CityCardProps) {
  return (
    <Link href={buildLocationHref(countryCode, slug)}>
      <Card className="group h-full rounded-2xl border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 cursor-pointer">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {name}, {state}
              </h3>
              <p className="text-sm text-muted-foreground">
                {providerCount} providers
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </CardContent>
      </Card>
    </Link>
  )
}
