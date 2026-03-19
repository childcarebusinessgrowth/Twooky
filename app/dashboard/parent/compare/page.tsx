import { RequireAuth } from "@/components/RequireAuth"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, CalendarClock, Globe2, Search, Scale } from "lucide-react"
import { SendInquiryButton } from "@/components/send-inquiry-button"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getCompareProvidersByParentProfileId } from "@/lib/parent-engagement"

export default async function ParentComparePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const comparisonProviders = user
    ? await getCompareProvidersByParentProfileId(supabase, user.id, baseUrl)
    : []

  const hasCompareCandidates = comparisonProviders.length >= 2

  return (
    <RequireAuth>
      <div className="space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            Compare providers
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            See your top choices side by side. Look at rating, daily fee, curriculum, and hours to
            find the best fit for your family.
          </p>
        </div>

        {comparisonProviders.length === 0 && (
          <Card className="rounded-3xl border border-dashed border-border/60 bg-card">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">No saved providers yet</p>
                <p className="text-xs text-muted-foreground max-w-md">
                  Save providers first, then compare them side by side by daily fee, schedule,
                  curriculum, and ratings.
                </p>
              </div>
              <Button asChild className="rounded-full">
                <Link href="/search">
                  <Search className="mr-1.5 h-4 w-4" />
                  Find providers
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {comparisonProviders.length === 1 && (
          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">
                Add at least one more provider to compare
              </CardTitle>
              <CardDescription className="text-xs">
                You need two or more saved providers for a side-by-side comparison.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {comparisonProviders[0].name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {comparisonProviders[0].location}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/search">
                    <Search className="mr-1.5 h-4 w-4" />
                    Find another provider
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link href="/dashboard/parent/saved">Manage saved list</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasCompareCandidates && (
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div
                className="grid gap-3 text-xs lg:text-sm"
                style={{ gridTemplateColumns: `160px repeat(${comparisonProviders.length}, minmax(0, 1fr))` }}
              >
                <div />
                {comparisonProviders.map((provider) => (
                  <Card
                    key={provider.providerProfileId}
                    className="border border-border/60 bg-card rounded-3xl shadow-sm"
                  >
                    <CardHeader className="space-y-2 pb-3">
                      <CardTitle className="text-sm font-semibold text-foreground line-clamp-2">
                        {provider.name}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                          {provider.rating > 0 ? provider.rating.toFixed(1) : "No rating"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {provider.location}
                        </span>
                      </CardDescription>
                      <Badge
                        variant="outline"
                        className="w-fit rounded-full border-border/60 bg-muted/50 text-[11px] text-muted-foreground"
                      >
                        {provider.reviewCount} reviews
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {provider.slug ? (
                        <>
                          <SendInquiryButton
                            providerSlug={provider.slug}
                            providerName={provider.name}
                            source="compare"
                            className="w-full rounded-full text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full rounded-full border-border/60 text-xs text-muted-foreground"
                            asChild
                          >
                            <Link href={`/providers/${provider.slug}`}>View full profile</Link>
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-full border-border/60 text-xs text-muted-foreground"
                          disabled
                        >
                          Profile unavailable
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {[
                  {
                    key: "rating",
                    label: "Rating",
                    value: (provider: (typeof comparisonProviders)[number]) =>
                      provider.rating > 0 ? `${provider.rating.toFixed(1)} / 5.0` : "No rating",
                  },
                  {
                    key: "tuition",
                    label: "Daily fee range",
                    value: (provider: (typeof comparisonProviders)[number]) => provider.tuitionRange,
                  },
                  {
                    key: "ages",
                    label: "Age groups",
                    value: (provider: (typeof comparisonProviders)[number]) => provider.ageGroups,
                  },
                  {
                    key: "curriculum",
                    label: "Curriculum",
                    value: (provider: (typeof comparisonProviders)[number]) => provider.curriculum,
                  },
                  {
                    key: "hours",
                    label: "Hours",
                    value: (provider: (typeof comparisonProviders)[number]) => provider.hours,
                    icon: CalendarClock,
                  },
                  {
                    key: "languages",
                    label: "Languages",
                    value: (provider: (typeof comparisonProviders)[number]) => provider.languages,
                    icon: Globe2,
                  },
                  {
                    key: "location",
                    label: "Location",
                    value: (provider: (typeof comparisonProviders)[number]) => provider.location,
                    icon: MapPin,
                  },
                ].map((metric) => (
                  <div
                    key={metric.key}
                    className="grid gap-3 text-[11px] lg:text-xs"
                    style={{
                      gridColumn: "1 / -1",
                      gridTemplateColumns: `160px repeat(${comparisonProviders.length}, minmax(0, 1fr))`,
                    }}
                  >
                    <div className="h-11 px-1 flex items-center font-medium text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {metric.icon ? <metric.icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                        {metric.label}
                      </span>
                    </div>
                    {comparisonProviders.map((provider) => (
                      <div
                        key={`${metric.key}-${provider.providerProfileId}`}
                        className="h-11 rounded-2xl border border-border/60 bg-card px-3 shadow-sm flex items-center"
                        title={metric.value(provider)}
                      >
                        <span className="truncate text-muted-foreground">{metric.value(provider)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  )
}

