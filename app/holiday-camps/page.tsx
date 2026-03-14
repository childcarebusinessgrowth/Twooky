import type { Metadata } from "next"
import { ProviderTypeSearchPage } from "@/components/provider-type-search-page"

export const metadata: Metadata = {
  title: "Holiday Camps for Children | Early Learning Directory",
  description:
    "Browse children's holiday camps near you, including school holiday clubs, activity camps, and seasonal childcare.",
}

export default function HolidayCampsSearchPage() {
  return (
    <ProviderTypeSearchPage
      title="Holiday Camp Search"
      description="Find holiday camps and school break programs near you."
      intro="Search by dates, themes, and age groups to secure engaging holiday childcare."
      defaultProviderType="holiday_camp"
    />
  )
}

