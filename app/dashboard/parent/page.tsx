import { RequireAuth } from "@/components/RequireAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import Image from "next/image"
import { Heart, Mail, Star, MapPin, Baby, Calendar, ArrowRight } from "lucide-react"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  getFavoriteCount,
  getReviewCount,
  getFavoritesByParentProfileId,
} from "@/lib/parent-engagement"
import { ParentSavedPreviewRow } from "@/components/parent-saved-preview-row"

type QuickStat = {
  id: string
  label: string
  value: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

type RecommendedProvider = {
  id: number
  name: string
  rating: number
  reviewCount: number
  location: string
  ageGroups: string[]
  description: string
  image: string
}

type InquiryStatus = "pending" | "contacted" | "scheduled"

type RecentInquiry = {
  id: number
  provider: string
  childAge: string
  messagePreview: string
  date: string
  status: InquiryStatus
}

type ComparisonItem = {
  id: number
  name: string
  rating: number
  tuitionRange: string
  ageGroups: string
  distance: string
}

type ParentProfileHeroData = {
  displayName: string
  cityName: string | null
  countryName: string | null
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
    return { displayName: "there", cityName: null, countryName: null }
  }

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
  }

  const admin = getSupabaseAdminClient()

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

const recommendedProviders: RecommendedProvider[] = [
  {
    id: 1,
    name: "Sunrise Montessori Preschool",
    rating: 4.9,
    reviewCount: 82,
    location: "Central Austin · 1.2 mi",
    ageGroups: ["Toddlers", "Preschool"],
    description: "Warm, play-based learning with a focus on independence and curiosity.",
    image: "/images/providers/classroom-01.jpg",
  },
  {
    id: 2,
    name: "Little Oaks Learning Center",
    rating: 4.8,
    reviewCount: 64,
    location: "South Austin · 2.5 mi",
    ageGroups: ["Infants", "Toddlers", "Preschool"],
    description: "Bright classrooms, outdoor play spaces, and nurturing teachers.",
    image: "/images/providers/playground-01.jpg",
  },
  {
    id: 3,
    name: "Greenway Nature Preschool",
    rating: 4.7,
    reviewCount: 39,
    location: "West Austin · 3.1 mi",
    ageGroups: ["Preschool"],
    description: "Outdoor-focused program with daily nature walks and garden time.",
    image: "/images/providers/outdoor-01.jpg",
  },
]

const recentInquiries: RecentInquiry[] = [
  {
    id: 1,
    provider: "Sunrise Montessori Preschool",
    childAge: "3 years",
    messagePreview: "Hi! We&apos;re looking for a spot starting in August, ideally 3 days a week...",
    date: "Today · 9:24 AM",
    status: "pending",
  },
  {
    id: 2,
    provider: "Little Oaks Learning Center",
    childAge: "18 months",
    messagePreview: "I&apos;d love to schedule a tour next week in the late afternoon if possible...",
    date: "Yesterday",
    status: "contacted",
  },
  {
    id: 3,
    provider: "Greenway Nature Preschool",
    childAge: "4 years",
    messagePreview: "Curious about your daily schedule and how much time is spent outdoors...",
    date: "Mar 9, 2026",
    status: "scheduled",
  },
]

const comparisonItems: ComparisonItem[] = [
  {
    id: 1,
    name: "Sunrise Montessori Preschool",
    rating: 4.9,
    tuitionRange: "$1,250–$1,550 / mo",
    ageGroups: "Toddlers · Preschool",
    distance: "1.2 mi",
  },
  {
    id: 2,
    name: "Little Oaks Learning Center",
    rating: 4.8,
    tuitionRange: "$1,050–$1,400 / mo",
    ageGroups: "Infants · Toddlers · Preschool",
    distance: "2.5 mi",
  },
  {
    id: 3,
    name: "Greenway Nature Preschool",
    rating: 4.7,
    tuitionRange: "$1,100–$1,450 / mo",
    ageGroups: "Preschool",
    distance: "3.1 mi",
  },
]

function getStatusBadge(status: InquiryStatus) {
  if (status === "pending") {
    return (
      <Badge className="bg-secondary/20 text-secondary-foreground hover:bg-secondary/20">
        Pending
      </Badge>
    )
  }

  if (status === "contacted") {
    return (
      <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
        Contacted
      </Badge>
    )
  }

  return (
    <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
      Scheduled visit
    </Badge>
  )
}

export default async function ParentDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const parentProfile = await getParentProfileHeroData()
  const welcomeName = parentProfile.displayName
  const searchLocation = parentProfile.cityName && parentProfile.countryName
    ? `${parentProfile.cityName}, ${parentProfile.countryName}`
    : parentProfile.cityName ?? parentProfile.countryName ?? "your area"

  const favoriteCount = user ? await getFavoriteCount(supabase, user.id) : 0
  const reviewCount = user ? await getReviewCount(supabase, user.id) : 0
  const inquiryCount = 3
  const quickStats = buildQuickStats(favoriteCount, reviewCount, inquiryCount)
  const savedPreview =
    user ? await getFavoritesByParentProfileId(supabase, user.id) : []

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
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 shadow-sm border border-border/60">
                    <Baby className="h-3.5 w-3.5 text-primary" />
                    <span>2 children · 2 &amp; 4 years</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 shadow-sm border border-border/60">
                    <MapPin className="h-3.5 w-3.5 text-secondary" />
                    <span>{searchLocation} · within 5 miles</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1 shadow-sm border border-border/60">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>Hoping to start · August</span>
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
                  className="rounded-full border-primary/20 bg-card/80"
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
              {quickStats.map((stat) => (
                <div
                  key={stat.id}
                  className="flex flex-col gap-1 rounded-2xl bg-muted/50 px-3 py-3 border border-border/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-sm">
                      <stat.icon className="h-3.5 w-3.5 text-primary" />
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
              className="hidden sm:inline-flex text-xs lg:text-sm"
              asChild
            >
              <Link href="/search">
                See more providers
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recommendedProviders.map((provider) => (
              <Card
                key={provider.id}
                className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <div className="h-36 w-full overflow-hidden bg-muted">
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
                      {provider.rating.toFixed(1)}
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
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {provider.description}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button asChild size="sm" className="flex-1 rounded-full">
                      <Link href="/providers/sunshine-learning-center">
                        View details
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-border/60"
                    >
                      <Heart className="mr-1.5 h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  {recentInquiries.map((inquiry) => (
                    <TableRow key={inquiry.id} className="border-b border-border/60">
                      <TableCell className="py-2 align-top">
                        <p className="max-w-[180px] text-xs font-medium text-foreground line-clamp-2">
                          {inquiry.provider}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-2 align-top text-xs text-muted-foreground">
                        {inquiry.childAge}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2 align-top text-xs text-muted-foreground max-w-xs">
                        <span className="line-clamp-2">
                          {inquiry.messagePreview}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2 align-top text-xs text-muted-foreground whitespace-nowrap">
                        {inquiry.date}
                      </TableCell>
                      <TableCell className="py-2 align-top">
                        {getStatusBadge(inquiry.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                You&apos;ve added a few options to compare. See how they stack up.
              </p>
            </div>
            <Button asChild size="sm" className="rounded-full text-xs lg:text-sm">
              <Link href="/dashboard/parent/compare">
                Compare now
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardContent className="pt-4">
              <div className="grid gap-4 md:grid-cols-3">
                {comparisonItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/50 px-3.5 py-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground line-clamp-2">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-secondary">
                        <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                        <span>{item.rating.toFixed(1)} overall rating</span>
                      </div>
                    </div>
                    <dl className="space-y-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Tuition</dt>
                        <dd className="font-medium text-foreground">
                          {item.tuitionRange}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Ages</dt>
                        <dd className="font-medium text-foreground text-right">
                          {item.ageGroups}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Distance</dt>
                        <dd className="font-medium text-foreground">
                          {item.distance}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </RequireAuth>
  )
}

