import { Building2, Star, FileCheck, PlusCircle, ArrowUpRight, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const stats = [
  {
    title: "Total Providers",
    value: "2,847",
    change: "+124",
    description: "new this month",
    icon: Building2,
  },
  {
    title: "Total Reviews",
    value: "18,432",
    change: "+856",
    description: "new this month",
    icon: Star,
  },
  {
    title: "Pending Claims",
    value: "23",
    change: "3",
    description: "need review",
    icon: FileCheck,
  },
  {
    title: "New Listings",
    value: "47",
    change: "+12%",
    description: "vs last month",
    icon: PlusCircle,
  },
]

const recentActivity = [
  {
    id: 1,
    type: "claim",
    message: "New claim request from Happy Kids Academy",
    time: "5 minutes ago",
    status: "pending"
  },
  {
    id: 2,
    type: "review",
    message: "New review flagged for moderation",
    time: "15 minutes ago",
    status: "flagged"
  },
  {
    id: 3,
    type: "listing",
    message: "Sunshine Daycare updated their listing",
    time: "1 hour ago",
    status: "updated"
  },
  {
    id: 4,
    type: "user",
    message: "New provider signup: Little Stars Preschool",
    time: "2 hours ago",
    status: "new"
  },
  {
    id: 5,
    type: "claim",
    message: "Claim approved for Bright Futures Learning",
    time: "3 hours ago",
    status: "approved"
  },
  {
    id: 6,
    type: "review",
    message: "Parent review submitted for Rainbow Kids",
    time: "4 hours ago",
    status: "new"
  },
  {
    id: 7,
    type: "listing",
    message: "New photos uploaded by Tiny Tots Center",
    time: "5 hours ago",
    status: "updated"
  },
  {
    id: 8,
    type: "claim",
    message: "Claim request rejected: Invalid documents",
    time: "6 hours ago",
    status: "rejected"
  },
]

const topProviders = [
  { name: "Sunshine Daycare", views: 1234, inquiries: 48, rating: 4.9 },
  { name: "Little Stars Preschool", views: 987, inquiries: 35, rating: 4.8 },
  { name: "Happy Kids Academy", views: 856, inquiries: 29, rating: 4.9 },
  { name: "Rainbow Learning", views: 743, inquiries: 24, rating: 4.7 },
  { name: "Bright Futures", views: 698, inquiries: 22, rating: 4.8 },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of platform activity and metrics</p>
      </div>

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
                <ArrowUpRight className="h-4 w-4 text-green-600" />
                <span className="text-green-600 text-sm font-medium">{stat.change}</span>
                <span className="text-muted-foreground text-sm">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform updates and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {activity.type === "claim" && <FileCheck className="h-4 w-4 text-muted-foreground" />}
                    {activity.type === "review" && <Star className="h-4 w-4 text-muted-foreground" />}
                    {activity.type === "listing" && <Building2 className="h-4 w-4 text-muted-foreground" />}
                    {activity.type === "user" && <PlusCircle className="h-4 w-4 text-muted-foreground" />}
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Providers */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Top Providers</CardTitle>
            <CardDescription>Highest performing listings this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProviders.map((provider, index) => (
                <div key={provider.name} className="flex items-center gap-4">
                  <div className="text-lg font-bold text-muted-foreground w-6">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {provider.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {provider.views} views · {provider.inquiries} inquiries
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium">{provider.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
