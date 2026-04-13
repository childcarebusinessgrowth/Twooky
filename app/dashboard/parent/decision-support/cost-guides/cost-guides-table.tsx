"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { CityMonthlyCostGuide } from "@/lib/cost-guides"

function countryCodeToCurrency(countryCode: string): string {
  const code = countryCode.trim().toUpperCase()
  if (code === "USA" || code === "US") return "USD"
  if (code === "UK" || code === "GB" || code === "GBR") return "GBP"
  if (code === "UAE" || code === "AE") return "AED"
  return "USD"
}

function formatAmount(amount: number | null, countryCode: string): string {
  if (amount == null) return "Insufficient data"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: countryCodeToCurrency(countryCode),
    maximumFractionDigits: 0,
  }).format(amount)
}

interface CostGuidesTableProps {
  guides: CityMonthlyCostGuide[]
}

export function CostGuidesTable({ guides }: CostGuidesTableProps) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()

  const filteredGuides = useMemo(() => {
    if (!normalizedQuery) return guides
    return guides.filter((guide) => {
      return (
        guide.cityName.toLowerCase().includes(normalizedQuery) ||
        guide.countryName.toLowerCase().includes(normalizedQuery) ||
        guide.countryCode.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [guides, normalizedQuery])

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle>City Cost Guide</CardTitle>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by city or country"
            className="pl-9"
            aria-label="Search city or country"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {guides.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No city cost guide data available yet.
          </p>
        ) : filteredGuides.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No city or country matches your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Active providers</th>
                  <th className="px-4 py-3 font-medium">Providers with pricing</th>
                  <th className="px-4 py-3 text-right font-medium">Median daily fee</th>
                  <th className="px-6 py-3 text-right font-medium">Estimated monthly fee</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuides.map((guide) => (
                  <tr key={guide.cityId} className="border-b border-border/60 text-sm">
                    <td className="px-6 py-3 font-medium text-foreground">{guide.cityName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{guide.countryName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{guide.providerCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {guide.providersWithPricingCount}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {formatAmount(guide.medianDailyFee, guide.countryCode)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-foreground">
                      {formatAmount(guide.estimatedMonthlyFee, guide.countryCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
