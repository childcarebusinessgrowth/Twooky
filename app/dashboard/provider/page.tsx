import { Eye, MessageSquare, Star, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RequireAuth } from "@/components/RequireAuth"
import Link from "next/link"

const stats = [
  {
    title: "Profile Views",
    value: "1,234",
    change: "+12%",
    trend: "up",
    icon: Eye,
    description: "vs last month"
  },
  {
    title: "Parent Inquiries",
    value: "48",
    change: "+8%",
    trend: "up",
    icon: MessageSquare,
    description: "vs last month"
  },
  {
    title: "Total Reviews",
    value: "127",
    change: "+3",
    trend: "up",
    icon: Star,
    description: "new this month"
  },
  {
    title: "Average Rating",
    value: "4.8",
    change: "+0.1",
    trend: "up",
    icon: TrendingUp,
    description: "out of 5.0"
  },
]

const recentInquiries = [
  {
    id: 1,
    parentName: "Sarah Johnson",
    childAge: "2 years",
    message: "Hi, I'm interested in your toddler program. Do you have any openings for...",
    date: "Today, 2:30 PM",
    status: "new"
  },
  {
    id: 2,
    parentName: "Michael Chen",
    childAge: "4 years",
    message: "We're looking for a preschool program starting in September. Can you tell me...",
    date: "Today, 11:15 AM",
    status: "new"
  },
  {
    id: 3,
    parentName: "Emily Williams",
    childAge: "6 months",
    message: "I'm looking for infant care 3 days a week. What are your rates for part-time...",
    date: "Yesterday",
    status: "contacted"
  },
  {
    id: 4,
    parentName: "David Martinez",
    childAge: "3 years",
    message: "Do you offer Montessori curriculum? We're very interested in that approach...",
    date: "Mar 8, 2026",
    status: "contacted"
  },
  {
    id: 5,
    parentName: "Jessica Brown",
    childAge: "18 months",
    message: "What is your staff-to-child ratio for toddlers? Also, do you provide meals...",
    date: "Mar 7, 2026",
    status: "replied"
  },
]

export default function ProviderDashboardPage() {
  return (
    <RequireAuth>
      <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your listing.</p>
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
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={stat.trend === "up" ? "text-green-600 text-sm font-medium" : "text-red-600 text-sm font-medium"}>
                  {stat.change}
                </span>
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
              {recentInquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">{inquiry.parentName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{inquiry.childAge}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                    {inquiry.message}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{inquiry.date}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        inquiry.status === "new" ? "default" : 
                        inquiry.status === "contacted" ? "secondary" : "outline"
                      }
                      className={
                        inquiry.status === "new" ? "bg-primary" : ""
                      }
                    >
                      {inquiry.status === "new" ? "New" : 
                       inquiry.status === "contacted" ? "Contacted" : "Replied"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </RequireAuth>
  )
}
