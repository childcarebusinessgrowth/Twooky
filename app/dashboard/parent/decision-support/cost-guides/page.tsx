import { getCityMonthlyCostGuides } from "@/lib/cost-guides"
import { CostGuidesTable } from "@/app/dashboard/parent/decision-support/cost-guides/cost-guides-table"

export const metadata = {
  title: "Cost Guides By City | Twooky",
  description: "Median daily childcare fee and estimated monthly fee by city based on active provider listings.",
}

export default async function ParentDecisionSupportCostGuidesPage() {
  const guides = await getCityMonthlyCostGuides()

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card px-6 py-8">
        <h1 className="text-2xl font-semibold text-foreground">Cost guides By City</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Real median daily fee by city, calculated from active provider listings in the directory.
          Monthly values are estimated from daily medians using 22 billable days.
        </p>
      </section>

      <CostGuidesTable guides={guides} />
    </div>
  )
}
