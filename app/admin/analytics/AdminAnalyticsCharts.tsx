"use client"

import { useId } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Line, LineChart, XAxis, YAxis } from "recharts"

export type GrowthPoint = {
  period: string
  parents: number
  providers: number
}

export type ReviewPoint = {
  period: string
  reviews: number
  avgRating: number | null
}

export type InquiryPoint = {
  period: string
  inquiries: number
}

export type FeaturedProviderPoint = {
  period: string
  featured: number
}

const parentsChartConfig = {
  parents: { label: "Parents", color: "var(--chart-1)" },
}

const providersChartConfig = {
  providers: { label: "Providers", color: "var(--chart-2)" },
}

const reviewsChartConfig = {
  reviews: { label: "Reviews", color: "var(--chart-3)" },
}

const avgRatingChartConfig = {
  avgRating: { label: "Avg. Rating", color: "var(--chart-4)" },
}

const inquiriesChartConfig = {
  inquiries: { label: "Inquiries", color: "var(--chart-2)" },
}

const featuredChartConfig = {
  featured: { label: "Featured Providers", color: "var(--chart-5)" },
}

const tickStyle = { fill: "var(--muted-foreground)", fontSize: 12 }

type AdminAnalyticsChartsProps = {
  growthData?: GrowthPoint[]
  reviewsData?: ReviewPoint[]
  inquiriesData?: InquiryPoint[]
  featuredData?: FeaturedProviderPoint[]
}

export function AdminAnalyticsCharts({
  growthData = [],
  reviewsData = [],
  inquiriesData = [],
  featuredData = [],
}: AdminAnalyticsChartsProps) {
  const id = useId().replace(/:/g, "")
  const parentsGradId = `parentsGradient-${id}`
  const providersGradId = `providersGradient-${id}`
  const inquiriesGradId = `inquiriesGradient-${id}`
  const featuredGradId = `featuredGradient-${id}`

  const hasReviews = reviewsData.some((d) => d.reviews > 0)
  const hasFeatured = featuredData.some((d) => d.featured > 0)
  const hasAvgRating = reviewsData.some((d) => d.avgRating != null)
  const hasParents = growthData.some((d) => d.parents > 0)
  const hasProviders = growthData.some((d) => d.providers > 0)

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Parents Growth</CardTitle>
            <CardDescription>New parent profiles created over time.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasParents ? (
              <ChartContainer config={parentsChartConfig} className="h-[300px] w-full">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={parentsGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="parents"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill={`url(#${parentsGradId})`}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No new parents in this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Providers Growth</CardTitle>
            <CardDescription>New provider profiles created over time.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasProviders ? (
              <ChartContainer config={providersChartConfig} className="h-[300px] w-full">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={providersGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="providers"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    fill={`url(#${providersGradId})`}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No new providers in this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>Number of reviews parents are leaving over time.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasReviews ? (
              <ChartContainer config={reviewsChartConfig} className="h-[300px] w-full">
                <AreaChart data={reviewsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`reviewsGradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="reviews"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    fill={`url(#reviewsGradient-${id})`}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No reviews in this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Featured Providers Growth</CardTitle>
            <CardDescription>
              New featured provider profiles created over time. Shows when current featured providers
              joined the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasFeatured ? (
              <ChartContainer config={featuredChartConfig} className="h-[300px] w-full">
                <AreaChart data={featuredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={featuredGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="featured"
                    stroke="var(--chart-5)"
                    strokeWidth={2}
                    fill={`url(#${featuredGradId})`}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No new featured providers in this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Average Rating</CardTitle>
            <CardDescription>How parents rate providers over time (0–5 scale).</CardDescription>
          </CardHeader>
          <CardContent>
            {hasAvgRating ? (
              <ChartContainer config={avgRatingChartConfig} className="h-[300px] w-full">
                <LineChart data={reviewsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={tickStyle}
                    domain={[0, 5]}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="avgRating"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                    dot={{ fill: "var(--chart-4)", strokeWidth: 0, r: 4 }}
                    connectNulls
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No ratings in this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Inquiries Over Time</CardTitle>
            <CardDescription>Volume of parent inquiries sent to providers in the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={inquiriesChartConfig} className="h-[300px] w-full">
              <AreaChart data={inquiriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={inquiriesGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  tickLine={false}
                  tick={tickStyle}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={tickStyle}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="inquiries"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  fill={`url(#${inquiriesGradId})`}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
