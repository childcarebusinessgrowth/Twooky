import { Building2, Star, FileCheck, PlusCircle, ArrowUpRight, ArrowDownRight, Clock, BarChart3, MessageCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { loadAdminDashboardData } from "@/lib/admin-dashboard"

export default async function AdminDashboardPage() {
  let stats: Awaited<ReturnType<typeof loadAdminDashboardData>>["stats"] = []
  let recentActivity: Awaited<ReturnType<typeof loadAdminDashboardData>>["recentActivity"] = []
  let topProviders: Awaited<ReturnType<typeof loadAdminDashboardData>>["topProviders"] = []
  let loadError: string | null = null

  try {
    const data = await loadAdminDashboardData()
    stats = data.stats
    recentActivity = data.recentActivity
    topProviders = data.topProviders
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load dashboard data"
  }

  const statConfig = [
    { title: "Total Providers", icon: Building2 },
    { title: "Total Reviews", icon: Star },
    { title: "Pending Claims", icon: FileCheck },
    { title: "New Listings", icon: PlusCircle },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of platform activity and metrics</p>
      </div>
      <Button asChild size="sm" className="mt-3 sm:mt-0 gap-2">
        <Link href="/admin/analytics">
          <BarChart3 className="h-4 w-4" />
          View detailed analytics
        </Link>
      </Button>

      {loadError && (
        <p className="text-sm text-destructive">{loadError}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((config, i) => {
          const stat = stats[i]
          const Icon = config.icon
          const title = stat?.title ?? config.title
          const value = stat?.value ?? ","
          const change = stat?.change ?? ","
          const description = stat?.description ?? ""
          const trend = stat?.trend ?? "neutral"
          return (
            <Card key={title} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {trend === "down" ? (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  )}
                  <span
                    className={
                      trend === "down"
                        ? "text-red-600 text-sm font-medium"
                        : trend === "up"
                          ? "text-green-600 text-sm font-medium"
                          : "text-muted-foreground text-sm"
                    }
                  >
                    {change}
                  </span>
                  <span className="text-muted-foreground text-sm">{description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>New activity today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No new activity today</p>
              ) : (
                recentActivity.map((activity) => {
                  const content = (
                    <>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {activity.type === "claim" && <FileCheck className="h-4 w-4 text-muted-foreground" />}
                        {activity.type === "review" && <Star className="h-4 w-4 text-muted-foreground" />}
                        {activity.type === "listing" && <Building2 className="h-4 w-4 text-muted-foreground" />}
                        {activity.type === "user" && <PlusCircle className="h-4 w-4 text-muted-foreground" />}
                        {activity.type === "flagged" && <Star className="h-4 w-4 text-muted-foreground" />}
                        {activity.type === "contact" && <MessageCircle className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                          <Badge
                            variant={
                              activity.status === "pending" ? "secondary" :
                              activity.status === "flagged" ? "destructive" :
                              activity.status === "approved" ? "default" :
                              activity.status === "rejected" ? "outline" :
                              "secondary"
                            }
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </>
                  )
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      {activity.type === "claim" ? (
                        <Link href="/admin/claims" className="flex items-start gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Top Providers</CardTitle>
            <CardDescription>Highest performing listings this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProviders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No provider data yet</p>
              ) : (
                topProviders.map((provider, index) => (
                  <div key={`${provider.name}-${index}`} className="flex items-center gap-4">
                    <div className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {provider.name.split(" ").map((w) => w[0]).join("").slice(0, 2) || ","}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {provider.inquiries} inquiries
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="font-medium">
                        {provider.rating != null ? provider.rating.toFixed(1) : ","}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
