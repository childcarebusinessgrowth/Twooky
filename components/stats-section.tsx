import { DollarSign, Building2, Star, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsSectionProps {
  stats: {
    averageCost: string
    totalProviders: number
    topRated: number
    waitlistAvg: string
  }
  cityName: string
}

export function StatsSection({ stats, cityName }: StatsSectionProps) {
  const statItems = [
    {
      icon: DollarSign,
      label: "Average Monthly Cost",
      value: stats.averageCost,
    },
    {
      icon: Building2,
      label: "Total Providers",
      value: stats.totalProviders.toString(),
    },
    {
      icon: Star,
      label: "Top Rated (4.5+ stars)",
      value: stats.topRated.toString(),
    },
    {
      icon: Clock,
      label: "Average Waitlist",
      value: stats.waitlistAvg,
    },
  ]

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Childcare Statistics in {cityName}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
