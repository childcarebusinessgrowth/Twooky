import { RequireAuth } from "@/components/RequireAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import Image from "next/image"
import { Heart, Mail, Star, MapPin, Baby, ArrowRight, Store } from "lucide-react"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  getFavoriteCount,
  getReviewCount,
  getInquiryCount,
  getFavoritesByParentProfileId,
  getRecentInquiriesByParentProfileId,
  getCompareProvidersByParentProfileId,
} from "@/lib/parent-engagement"
import { getRecommendedProvidersForDashboard } from "@/lib/search-providers-db"
import { ParentSavedPreviewRow } from "@/components/parent-saved-preview-row"
import { RecommendedProviderSaveButton } from "@/components/recommended-provider-save-button"
import { cn } from "@/lib/utils"

type QuickStat = {
  id: string
  label: string
  value: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}


type ParentProfileHeroData = {
  displayName: string
  cityName: string | null
  countryName: string | null
  childAgeGroup: string | null
}

const CHILD_AGE_GROUP_LABELS: Record<string, string> = {
  infant: "Infant (0-12 months)",
  toddler: "Toddler (1-2 years)",
  preschool: "Preschool (3-4 years)",
  prek: "Pre-K (4-5 years)",
  school: "School Age (5+)",
}

function getChildAgeGroupDisplay(value: string | null): string | null {
  if (!value || typeof value !== "string") return null
  const trimmed = value.trim().toLowerCase()
  return CHILD_AGE_GROUP_LABELS[trimmed] ?? trimmed
}

function toCleanString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isMissingProfileLocationColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const code = "code" in error ? String(error.code ?? "") : ""
  const message = "message" in error ? String(error.message ?? "").toLowerCase() : ""

  return (
    (code === "42703" || code === "PGRST204") &&
    (message.includes("city_name") ||
      message.includes("country_name") ||
      message.includes("profiles.city_name") ||
      message.includes("profiles.country_name"))
  )
}

async function getParentProfileHeroData(): Promise<ParentProfileHeroData> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { displayName: "there", cityName: null, countryName: null, childAgeGroup: null }
  }

  const admin = getSupabaseAdminClient()
  const { data: parentProfileRow } = await admin
    .from("parent_profiles")
    .select("child_age_group")
    .eq("profile_id", user.id)
    .maybeSingle()
  const childAgeGroup = toCleanString(parentProfileRow?.child_age_group)

  const metadataDisplayName =
    toCleanString(user.user_metadata?.display_name) ??
    toCleanString(user.user_metadata?.full_name) ??
    toCleanString(user.user_metadata?.name)
  const metadataCityName = toCleanString(user.user_metadata?.city_name)
  const metadataCountryName = toCleanString(user.user_metadata?.country_name)

  const fallbackData: ParentProfileHeroData = {
    displayName: metadataDisplayName ?? "there",
    cityName: metadataCityName,
    countryName: metadataCountryName,
    childAgeGroup,
  }

  const { data: profileWithLocation, error: profileWithLocationError } = await admin
    .from("profiles")
    .select("display_name, city_name, country_name")
    .eq("id", user.id)
    .maybeSingle()

  if (!profileWithLocationError) {
    return {
      displayName: toCleanString(profileWithLocation?.display_name) ?? fallbackData.displayName,
      cityName: toCleanString(profileWithLocation?.city_name) ?? fallbackData.cityName,
      countryName: toCleanString(profileWithLocation?.country_name) ?? fallbackData.countryName,
      childAgeGroup: fallbackData.childAgeGroup,
    }
  }

  if (!isMissingProfileLocationColumnError(profileWithLocationError)) {
    console.error("Unable to load parent profile location data:", profileWithLocationError)
    return fallbackData
  }

  const { data: profileWithoutLocation, error: profileWithoutLocationError } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle()

  if (profileWithoutLocationError) {
    console.error("Unable to load parent profile data:", profileWithoutLocationError)
    return fallbackData
  }

  return {
    displayName: toCleanString(profileWithoutLocation?.display_name) ?? fallbackData.displayName,
    cityName: fallbackData.cityName,
    countryName: fallbackData.countryName,
    childAgeGroup: fallbackData.childAgeGroup,
  }
}

function buildQuickStats(
  savedCount: number,
  reviewCount: number,
  inquiryCount: number
): QuickStat[] {
  return [
    {
      id: "saved",
      label: "Saved providers",
      value: String(savedCount),
      description: "Places you&apos;re keeping an eye on",
      icon: Heart,
    },
    {
      id: "inquiries",
      label: "Inquiries sent",
      value: String(inquiryCount),
      description: "Providers you&apos;ve reached out to",
      icon: Mail,
    },
    {
      id: "reviews",
      label: "Reviews written",
      value: String(reviewCount),
      description: "Shared with other parents",
      icon: Star,
    },
  ]
}

function formatInquiryDate(createdAt: string): string {
  const d = new Date(createdAt)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const inquiryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - inquiryDay.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) {
    return `Today · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
  }
  if (diffDays === 1) return "Yesterday"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function ParentDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const parentProfile = await getParentProfileHeroData()
  const welcomeName = parentProfile.displayName
  const searchLocation = parentProfile.cityName && parentProfile.countryName
    ? `${parentProfile.cityName}, ${parentProfile.countryName}`
    : parentProfile.cityName ?? parentProfile.countryName ?? "your area"

  const favoriteCount = user ? await getFavoriteCount(supabase, user.id) : 0
  const reviewCount = user ? await getReviewCount(supabase, user.id) : 0
  const inquiryCount = user ? await getInquiryCount(supabase, user.id) : 0
  const quickStats = buildQuickStats(favoriteCount, reviewCount, inquiryCount)
  const savedPreview =
    user ? await getFavoritesByParentProfileId(supabase, user.id, baseUrl) : []
  const recentInquiriesList =
    user ? await getRecentInquiriesByParentProfileId(supabase, user.id, 5) : []
  const compareProviders = user
    ? await getCompareProvidersByParentProfileId(supabase, user.id, baseUrl, { limit: 3 })
    : []
  const recommendedProviders = await getRecommendedProvidersForDashboard(
    supabase,
    baseUrl,
    3
  )

  return (
    <RequireAuth>
      <div className="space-y-8 lg:space-y-10">
        {/* Welcome / hero */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1.3fr)] lg:items-stretch">
          <Card className="border-none bg-linear-to-r from-primary/10 via-secondary/10 to-primary/10 shadow-md shadow-black/5 rounded-3xl">
            <CardContent className="flex h-full flex-col justify-between gap-6 p-6 lg:p-8">
              <div className="space-y-4">
                <Badge className="bg-card/90 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium shadow-sm w-fit">
                  Ongoing search · {searchLocation}
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                    Welcome back, {welcomeName} 👋
                  </h1>
                  <p className="text-sm lg:text-base text-muted-foreground max-w-xl">
                    Continue exploring childcare providers near {searchLocation}. Pick up where you left off
                    with saved providers, messages, and visits.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs lg:text-sm text-muted-foreground">
                  {getChildAgeGroupDisplay(parentProfile.childAgeGroup) && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 shadow-sm border border-border/60">
                      <Baby className="h-3.5 w-3.5 text-primary" />
                      <span>Age · {getChildAgeGroupDisplay(parentProfile.childAgeGroup)}</span>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 shadow-sm border border-border/60">
                    <MapPin className="h-3.5 w-3.5 text-secondary" />
                    <span>{searchLocation} · within 5 miles</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/search">
                    Continue search
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-full border-secondary/30 bg-card/80 text-secondary hover:bg-secondary/10 hover:text-secondary hover:border-secondary/50"
                >
                  <Link href="/dashboard/parent/saved">
                    View saved providers
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-card rounded-3xl shadow-md shadow-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Your childcare search at a glance
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Keep track of saved places, messages, and reviews in one place.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 pt-1">
              {quickStats.map((stat, index) => (
                <div
                  key={stat.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-2xl px-3 py-3 border",
                    index === 1
                      ? "bg-secondary/5 border-secondary/20"
                      : "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </span>
                    <span className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm",
                      index === 1 ? "bg-secondary/10" : "bg-primary/10"
                    )}>
                      <stat.icon className={cn(
                        "h-3.5 w-3.5",
                        index === 1 ? "text-secondary" : "text-primary"
                      )} />
                    </span>
                  </div>
                  <div className="text-xl font-semibold text-foreground">
                    {stat.value}
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Recommended providers */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base lg:text-lg font-semibold text-foreground">
                Recommended childcare near you
              </h2>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Based on your children&apos;s ages, location, and what other parents love.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-xs lg:text-sm text-muted-foreground hover:text-primary"
              asChild
            >
              <Link href="/search">
                See more providers
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendedProviders.length > 0 ? (
              recommendedProviders.map((provider) => (
                <Card
                  key={provider.id}
                  className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <div className="h-36 w-full overflow-hidden bg-muted relative">
                      <Image
                        src={provider.image}
                        alt={provider.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium text-secondary shadow-sm">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-secondary text-secondary" />
                        {provider.rating > 0 ? provider.rating.toFixed(1) : "—"}
                      </span>
                      <span className="text-muted-foreground">({provider.reviewCount})</span>
                    </div>
                  </div>
                  <CardContent className="space-y-2.5 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">
                        {provider.name}
                      </p>
                      <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{provider.location}</span>
                      </div>
                    </div>
                    {provider.ageGroups.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {provider.ageGroups.map((group) => (
                          <Badge
                            key={group}
                            variant="outline"
                            className="rounded-full border-primary/20 bg-primary/10 text-[11px] text-primary"
                          >
                            {group}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {provider.description}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button asChild size="sm" className="flex-1 rounded-full">
                        <Link href={`/providers/${provider.slug}`}>
                          View details
                        </Link>
                      </Button>
                      {user ? (
                        <RecommendedProviderSaveButton
                          parentProfileId={user.id}
                          providerProfileId={provider.id}
                          className="rounded-full border-secondary/30 text-secondary hover:bg-secondary/10 hover:border-secondary/50"
                        />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full border-secondary/30 text-secondary"
                          asChild
                        >
                          <Link href={`/providers/${provider.slug}`}>
                            <Heart className="mr-1.5 h-3.5 w-3.5" />
                            Save
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="md:col-span-3 rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No recommended providers right now</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Check back later or search for childcare in your area.
                </p>
                <Button asChild size="sm" className="mt-3 rounded-full">
                  <Link href="/search">Search providers</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Saved providers preview + recent inquiries */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr),minmax(0,1.4fr)]">
          {/* Saved preview */}
          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Your saved childcare providers
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Keep favorites in one place so you can compare later.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/dashboard/parent/saved">
                  View all
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {savedPreview.length > 0 && user ? (
                savedPreview.slice(0, 5).map((fav) => (
                  <ParentSavedPreviewRow
                    key={fav.id}
                    parentProfileId={user.id}
                    providerProfileId={fav.provider_profile_id}
                    providerName={fav.provider_business_name ?? "Provider"}
                    providerSlug={fav.provider_slug}
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2">
                  Save providers from their profile to see them here.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent inquiries */}
          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Your recent messages
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Follow up on inquiries and upcoming visits.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/dashboard/parent/inquiries">
                  Open inbox
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-1">
              {recentInquiriesList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-muted-foreground">Provider</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs text-muted-foreground">
                        Child age
                      </TableHead>
                      <TableHead className="hidden md:table-cell text-xs text-muted-foreground">
                        Message
                      </TableHead>
                      <TableHead className="hidden lg:table-cell text-xs text-muted-foreground">
                        Date
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInquiriesList.map((inquiry) => (
                      <TableRow key={inquiry.id} className="border-b border-border/60">
                        <TableCell className="py-2 align-top">
                          <p className="max-w-[180px] text-xs font-medium text-foreground line-clamp-2">
                            {inquiry.provider_slug ? (
                              <Link
                                href={`/providers/${inquiry.provider_slug}`}
                                className="hover:underline"
                              >
                                {inquiry.provider_business_name ?? "Provider"}
                              </Link>
                            ) : (
                              inquiry.provider_business_name ?? "Provider"
                            )}
                          </p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-2 align-top text-xs text-muted-foreground">
                          {getChildAgeGroupDisplay(parentProfile.childAgeGroup) ?? "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-2 align-top text-xs text-muted-foreground max-w-xs">
                          <span className="line-clamp-2">
                            {inquiry.inquiry_subject?.trim() || "Message sent"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-2 align-top text-xs text-muted-foreground whitespace-nowrap">
                          {formatInquiryDate(inquiry.created_at)}
                        </TableCell>
                        <TableCell className="py-2 align-top">
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                            Sent
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-xs text-muted-foreground py-2">
                  No messages yet. Inquiries you send to providers will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Compare providers preview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base lg:text-lg font-semibold text-foreground">
                Compare providers side by side
              </h2>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Compare your saved options by ratings, daily fee, schedule, and curriculum.
              </p>
            </div>
            {compareProviders.length >= 2 ? (
              <Button asChild size="sm" className="rounded-full text-xs lg:text-sm">
                <Link href="/dashboard/parent/compare">
                  Compare now
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="rounded-full text-xs lg:text-sm">
                <Link href="/dashboard/parent/saved">
                  Manage saved list
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardContent className="pt-4">
              {compareProviders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-foreground">No saved providers yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Save a few providers from search results to unlock side-by-side comparison.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-3">
                    {compareProviders.map((item) => (
                      <div
                        key={item.providerProfileId}
                        className="flex flex-col gap-2 rounded-2xl border border-border/60 border-l-primary/50 bg-primary/5 px-3.5 py-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground line-clamp-2">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-secondary">
                            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                            <span>
                              {item.rating > 0 ? `${item.rating.toFixed(1)} overall rating` : "No ratings yet"}
                            </span>
                          </div>
                        </div>
                        <dl className="space-y-1.5 text-[11px] text-muted-foreground">
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-muted-foreground">Daily fee</dt>
                            <dd className="font-medium text-foreground text-right">{item.tuitionRange}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-muted-foreground">Ages</dt>
                            <dd className="font-medium text-foreground text-right line-clamp-2">
                              {item.ageGroups}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-muted-foreground">Location</dt>
                            <dd className="font-medium text-foreground text-right line-clamp-2">
                              {item.location}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                  {compareProviders.length === 1 ? (
                    <p className="text-xs text-muted-foreground">
                      Save at least one more provider to compare side by side.
                    </p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Local Services & Deals teaser */}
        <section>
          <Card className="rounded-3xl border border-border/60 bg-gradient-to-r from-secondary/10 via-primary/5 to-secondary/10 shadow-sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 lg:p-6">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-foreground">
                    Discover local providers and exclusive deals
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Swimming schools, baby classes, music, and more — plus discounts for Early Learning families.
                  </p>
                </div>
              </div>
              <Button asChild size="lg" className="rounded-full shrink-0">
                <Link href="/dashboard/parent/local-services">
                  View Local Services & Deals
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </RequireAuth>
  )
}

