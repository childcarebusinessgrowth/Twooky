"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, Bar, BarChart, Area, AreaChart } from "recharts"

const viewsData = [
  { month: "Jan", views: 450 },
  { month: "Feb", views: 520 },
  { month: "Mar", views: 680 },
  { month: "Apr", views: 590 },
  { month: "May", views: 720 },
  { month: "Jun", views: 850 },
  { month: "Jul", views: 920 },
  { month: "Aug", views: 1100 },
  { month: "Sep", views: 980 },
  { month: "Oct", views: 1050 },
  { month: "Nov", views: 1150 },
  { month: "Dec", views: 1234 },
]

const inquiriesData = [
  { month: "Jan", inquiries: 12, converted: 4 },
  { month: "Feb", inquiries: 18, converted: 6 },
  { month: "Mar", inquiries: 22, converted: 8 },
  { month: "Apr", inquiries: 15, converted: 5 },
  { month: "May", inquiries: 28, converted: 10 },
  { month: "Jun", inquiries: 35, converted: 12 },
  { month: "Jul", inquiries: 42, converted: 15 },
  { month: "Aug", inquiries: 38, converted: 14 },
  { month: "Sep", inquiries: 45, converted: 18 },
  { month: "Oct", inquiries: 40, converted: 16 },
  { month: "Nov", inquiries: 48, converted: 20 },
  { month: "Dec", inquiries: 48, converted: 18 },
]

const reviewsData = [
  { month: "Jan", reviews: 2, rating: 4.5 },
  { month: "Feb", reviews: 3, rating: 4.7 },
  { month: "Mar", reviews: 5, rating: 4.8 },
  { month: "Apr", reviews: 2, rating: 4.6 },
  { month: "May", reviews: 4, rating: 4.9 },
  { month: "Jun", reviews: 6, rating: 4.8 },
  { month: "Jul", reviews: 4, rating: 4.7 },
  { month: "Aug", reviews: 5, rating: 4.8 },
  { month: "Sep", reviews: 7, rating: 4.9 },
  { month: "Oct", reviews: 3, rating: 4.8 },
  { month: "Nov", reviews: 5, rating: 4.8 },
  { month: "Dec", reviews: 4, rating: 4.8 },
]

const chartConfig = {
  views: { label: "Views", color: "var(--chart-1)" },
  inquiries: { label: "Inquiries", color: "var(--chart-2)" },
  converted: { label: "Converted", color: "var(--chart-1)" },
  reviews: { label: "Reviews", color: "var(--chart-3)" },
  rating: { label: "Rating", color: "var(--chart-4)" },
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your listing performance and engagement</p>
        </div>
        <Select defaultValue="12months">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="12months">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Profile Views Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Profile Views</CardTitle>
          <CardDescription>Number of times parents viewed your listing</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={viewsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="views" 
                stroke="var(--chart-1)" 
                strokeWidth={2}
                fill="url(#viewsGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Inquiry Conversion Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Inquiry Conversion</CardTitle>
          <CardDescription>Inquiries received vs converted to enrollments</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={inquiriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="inquiries" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'var(--chart-2)' }} />
              <span className="text-sm text-muted-foreground">Total Inquiries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'var(--chart-1)' }} />
              <span className="text-sm text-muted-foreground">Converted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Growth Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Review Growth</CardTitle>
          <CardDescription>New reviews received over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={reviewsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="reviews" 
                stroke="var(--chart-3)" 
                strokeWidth={2}
                dot={{ fill: 'var(--chart-3)', strokeWidth: 0, r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">37.5%</div>
            <p className="text-sm text-muted-foreground">of inquiries convert to enrollments</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Avg. Response Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">2.4h</div>
            <p className="text-sm text-muted-foreground">time to first response</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Search Ranking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">#3</div>
            <p className="text-sm text-muted-foreground">in San Francisco area</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
