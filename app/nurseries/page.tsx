import { Metadata } from "next"
import { ProviderTypeSearchPage } from "@/components/provider-type-search-page"

export const metadata: Metadata = {
  title: "Find Nurseries Near You | Early Learning Directory",
  description:
    "Discover Ofsted-registered nurseries near you. Compare ratings, programs, fees, and availability to find the best nursery for your child.",
}

export default function NurseriesSearchPage() {
  return (
    <ProviderTypeSearchPage
      title="Nursery Search"
      description="Search and compare nurseries in your area, including full-day and part-day care options."
      intro="Use filters to narrow nurseries by age group, curriculum, opening hours, fees, and more."
      defaultProviderType="nursery"
    />
  )
}

