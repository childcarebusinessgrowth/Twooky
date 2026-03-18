import Image from "next/image"
import { Eye, MessageSquare, Star, TrendingUp, ArrowUpRight, ArrowDownRight, ImageIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RequireAuth } from "@/components/RequireAuth"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getProviderOverviewData, type RecentInquiryRow } from "@/lib/provider-dashboard"
import { ProviderOnboardingWelcome } from "@/components/provider/ProviderOnboardingWelcome"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"

function buildProviderPhotoPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return ""
  return `${base}/storage/v1/object/public/${PROVIDER_PHOTOS_BUCKET}/${storagePath}`
}

function formatOverviewDate(s: string): string {
  const d = new Date(s)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const inquiryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.floor((today.getTime() - inquiryDay.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return `Today · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" })
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined })
}

export default async function ProviderDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let dashboardPhotos: { id: string; url: string; caption: string | null }[] = []
  let overview: Awaited<ReturnType<typeof getProviderOverviewData>>
  let listingStatus: string | null = null
  let isNewProvider = false
  if (user) {
    overview = await getProviderOverviewData(supabase, user.id)
    const { data: profileRow } = await supabase
      .from("provider_profiles")
      .select("listing_status, onboarding_tour_shown_at")
      .eq("profile_id", user.id)
      .maybeSingle()
    listingStatus = profileRow?.listing_status ?? null
    isNewProvider =
      profileRow != null &&
      profileRow.onboarding_tour_shown_at == null &&
      (profileRow.listing_status === "draft" || profileRow.listing_status == null)
    const { data: rows } = await supabase
      .from("provider_photos")
      .select("id, storage_path, caption")
      .eq("provider_profile_id", user.id)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(6)
    dashboardPhotos = (rows ?? []).map((row) => ({
      id: row.id,
      url: buildProviderPhotoPublicUrl(row.storage_path),
      caption: row.caption,
    }))
  } else {
    overview = {
      profileViews: 0,
      profileViewsPrevMonth: 0,
      inquiryCount: 0,
      guestInquiryCount: 0,
      reviewCount: 0,
      reviewCountThisMonth: 0,
      averageRating: null,
      recentInquiries: [],
    }
  }

  const totalInquiries = overview.inquiryCount + overview.guestInquiryCount
  const profileViewPct =
    overview.profileViewsPrevMonth > 0
      ? Math.round(
          ((overview.profileViews - overview.profileViewsPrevMonth) / overview.profileViewsPrevMonth) * 100
        )
      : 0
  const stats = [
    {
      title: "Profile Views",
      value: overview.profileViews.toLocaleString(),
      change: profileViewPct >= 0 ? `+${profileViewPct}%` : `${profileViewPct}%`,
      trend: profileViewPct >= 0 ? "up" as const : "down" as const,
      icon: Eye,
      description: "vs last month",
    },
    {
      title: "Parent Inquiries",
      value: totalInquiries.toLocaleString(),
      change: "—",
      trend: "up" as const,
      icon: MessageSquare,
      description: "total",
    },
    {
      title: "Total Reviews",
      value: overview.reviewCount.toLocaleString(),
      change: overview.reviewCountThisMonth > 0 ? `+${overview.reviewCountThisMonth}` : "0",
      trend: "up" as const,
      icon: Star,
      description: "new this month",
    },
    {
      title: "Average Rating",
      value: overview.averageRating != null ? overview.averageRating.toFixed(1) : "—",
      change: "—",
      trend: "up" as const,
      icon: TrendingUp,
      description: "out of 5.0",
    },
  ]

  return (
    <RequireAuth>
      <ProviderOnboardingWelcome isNewProvider={isNewProvider} />
      <div className="space-y-6">
      {/* Draft/Pending listing banner */}
      {listingStatus === "draft" && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground">
              Complete your profile in <Link href="/dashboard/provider/listing" className="font-medium text-primary underline underline-offset-2">Manage Listing &amp; Tour</Link> and submit it for admin approval. You&apos;ll be notified once your listing is live.
            </p>
          </CardContent>
        </Card>
      )}
      {listingStatus === "pending" && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground">
              Thank you. Your listing has been submitted and is awaiting admin approval. Editing is locked until approval, and we&apos;ll notify you when it&apos;s live.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your listing.</p>
      </div>

      {/* Photos prompt when none uploaded */}
      {dashboardPhotos.length === 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground">
              Add at least one photo so families can see your space. Go to <Link href="/dashboard/provider/photos" className="font-medium text-primary underline underline-offset-2">Photos</Link> to upload.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Photos section */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Your facility gallery. Add and manage photos to showcase your space to families.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/provider/photos">
              {dashboardPhotos.length > 0 ? "Manage photos" : "Add photos"}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {dashboardPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {dashboardPhotos.map((photo) => (
                <Link
                  key={photo.id}
                  href="/dashboard/provider/photos"
                  className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? "Facility photo"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm font-medium">No photos yet</p>
              <p className="text-xs mt-1">Upload photos of your facility to attract more parents.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.change !== "—" && (
                  <>
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className={stat.trend === "up" ? "text-green-600 text-sm font-medium" : "text-red-600 text-sm font-medium"}>
                      {stat.change}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground text-sm">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Virtual tour quick access */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>Virtual Tour</CardTitle>
            <CardDescription>
              Add or update your YouTube virtual tour link so families can view it on your public provider details page.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/provider/listing">Add Video URL</Link>
          </Button>
        </CardHeader>
      </Card>

      {/* Recent inquiries */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Inquiries</CardTitle>
            <CardDescription>Parent messages and tour requests</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/provider/inquiries">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parent</TableHead>
                <TableHead className="hidden sm:table-cell">Child Age</TableHead>
                <TableHead className="hidden md:table-cell">Message</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.recentInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No inquiries yet
                  </TableCell>
                </TableRow>
              ) : (
                overview.recentInquiries.map((inquiry: RecentInquiryRow) => (
                  <TableRow key={`${inquiry.type}-${inquiry.id}`}>
                    <TableCell className="font-medium">{inquiry.parentName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{inquiry.childAge}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                      {inquiry.messagePreview}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {formatOverviewDate(inquiry.date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={inquiry.status === "new" ? "default" : "outline"}
                        className={inquiry.status === "new" ? "bg-primary" : ""}
                      >
                        {inquiry.status === "new" ? "New" : "Replied"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </RequireAuth>
  )
}
