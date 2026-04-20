import Link from "next/link"
import { ArrowRight, Globe2, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPopularLocations } from "@/lib/popular-locations"

export const metadata = {
  title: "Childcare Locations | Twooky",
  description:
    "Explore childcare locations across our supported countries. Browse cities and find trusted childcare providers near you.",
}

function getCityName(label: string) {
  const prefix = "Childcares in "
  return label.startsWith(prefix) ? label.slice(prefix.length) : label
}

export default async function ChildcareLocationsPage() {
  const popularLocations = await getPopularLocations()
  const defaultCountry = popularLocations[0]?.country ?? "USA"
  const totalLocations = popularLocations.reduce(
    (count, group) => count + group.locations.length,
    0,
  )
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-b from-primary/10 via-background to-background">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-14 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Globe2 className="h-3.5 w-3.5" />
            Global directory
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground text-balance">
            Browse Childcare Locations
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
            Find childcares in popular cities across our supported countries. Pick a country,
            explore locations, and jump straight into your search.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3 max-w-2xl">
            <Card className="border-border/60 bg-card/70">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Countries</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{popularLocations.length}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/70">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Popular cities</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{totalLocations}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/70">
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Search support</p>
                <p className="mt-1 text-2xl font-bold text-foreground">24/7</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="rounded-3xl border border-border/60 bg-card p-5 md:p-8 shadow-sm">
            <Tabs defaultValue={defaultCountry} className="gap-6">
              <TabsList className="h-auto w-full flex-wrap rounded-2xl bg-muted/70 p-1.5 md:w-fit">
                {popularLocations.map((group) => (
                  <TabsTrigger
                    key={group.country}
                    value={group.country}
                    className="min-w-20 rounded-xl px-4 py-2"
                  >
                    {group.country}
                  </TabsTrigger>
                ))}
              </TabsList>

              {popularLocations.map((group) => (
                <TabsContent key={group.country} value={group.country}>
                  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                        Childcares in {group.country}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {group.locations.length} popular cities ready to explore
                      </p>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href={`/search?country=${group.country.toLowerCase()}`}>
                        <Search className="h-4 w-4" />
                        Search all in {group.country}
                      </Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.locations.map((location) => (
                      <Link key={location.href} href={location.href} className="group">
                        <Card className="h-full border-border/60 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
                          <CardContent className="flex items-center justify-between gap-3 p-5">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                                <MapPin className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="text-base font-semibold text-foreground">
                                  {getCityName(location.label)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {group.country} childcare directory
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="mt-8 rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
            <p className="text-sm md:text-base text-muted-foreground">
              Looking for more options? Use advanced filters to find the right childcare by city, program type, and age group.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/search">
                  Explore all search filters
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
