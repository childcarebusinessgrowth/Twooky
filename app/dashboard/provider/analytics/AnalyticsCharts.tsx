"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import type { ProviderAnalyticsData, DateRangeKey } from "@/lib/provider-analytics"

const chartConfig = {
  views: { label: "Views", color: "var(--chart-1)" },
  visits: { label: "Website Visits", color: "var(--chart-4)" },
  uniqueVisitors: { label: "Unique Visitors", color: "var(--chart-5)" },
  inquiries: { label: "Inquiries", color: "var(--chart-2)" },
  converted: { label: "Converted", color: "var(--chart-1)" },
  reviews: { label: "Reviews", color: "var(--chart-3)" },
  rating: { label: "Rating", color: "var(--chart-4)" },
}

const RANGE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: "7days", label: "Last 7 days" },
  { value: "30days", label: "Last 30 days" },
  { value: "3months", label: "Last 3 months" },
  { value: "12months", label: "Last 12 months" },
]

type AnalyticsChartsProps = {
  data: ProviderAnalyticsData
  currentRange: DateRangeKey
}

function formatResponseTime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(1)}h`
  const days = hours / 24
  return `${days.toFixed(1)}d`
}

export function AnalyticsCharts({ data, currentRange }: AnalyticsChartsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleRangeChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("range", value)
    router.push(`/dashboard/provider/analytics?${next.toString()}`)
  }

  const {
    viewsByMonth,
    micrositeTrafficByMonth,
    inquiriesByMonth,
    reviewsByMonth,
    micrositeVisitsTotal,
    micrositeUniqueVisitorsTotal,
    conversionRatePercent,
    avgResponseTimeHours,
    searchRank,
    searchRankAreaLabel,
  } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your listing performance and engagement</p>
        </div>
        <Select value={currentRange} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Profile Views</CardTitle>
          <CardDescription>Number of times parents viewed your listing</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={viewsByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
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

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Published Site Traffic</CardTitle>
          <CardDescription>Visits and unique visitors on your published microsite</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart data={micrositeTrafficByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="micrositeVisitsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                type="number"
                domain={([, dataMax]) => [0, Math.max(dataMax, 1)]}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="linear"
                dataKey="visits"
                stroke="var(--chart-4)"
                strokeWidth={2}
                fill="url(#micrositeVisitsGradient)"
              />
              <Line
                type="linear"
                dataKey="uniqueVisitors"
                stroke="var(--chart-5)"
                strokeWidth={2}
                dot={{ fill: "var(--chart-5)", strokeWidth: 0, r: 3 }}
              />
            </ComposedChart>
          </ChartContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "var(--chart-4)" }} />
              <span className="text-sm text-muted-foreground">Website Visits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "var(--chart-5)" }} />
              <span className="text-sm text-muted-foreground">Unique Visitors</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Inquiry Conversion</CardTitle>
          <CardDescription>Inquiries received vs converted to enrollments</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={inquiriesByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="inquiries" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "var(--chart-2)" }} />
              <span className="text-sm text-muted-foreground">Total Inquiries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "var(--chart-1)" }} />
              <span className="text-sm text-muted-foreground">Converted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Review Growth</CardTitle>
          <CardDescription>New reviews received over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={reviewsByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="reviews"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={{ fill: "var(--chart-3)", strokeWidth: 0, r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Website Visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{micrositeVisitsTotal.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">total published site visits in range</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Unique Visitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{micrositeUniqueVisitorsTotal.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">distinct visitors in selected range</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {conversionRatePercent != null ? `${conversionRatePercent}%` : "—"}
            </div>
            <p className="text-sm text-muted-foreground">of inquiries convert to enrollments</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Avg. Response Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {avgResponseTimeHours != null ? formatResponseTime(avgResponseTimeHours) : "—"}
            </div>
            <p className="text-sm text-muted-foreground">time to first response</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Search Ranking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {searchRank != null ? `#${searchRank}` : "—"}
            </div>
            <p className="text-sm text-muted-foreground">in {searchRankAreaLabel}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
