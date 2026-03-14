import type { Metadata } from "next"
import { ProviderTypeSearchPage } from "@/components/provider-type-search-page"

export const metadata: Metadata = {
  title: "Find Preschools Near You | Early Learning Directory",
  description:
    "Explore preschools near you and compare programs, ratings, curriculum, and fees to find the right preschool for your child.",
}

export default function PreschoolsSearchPage() {
  return (
    <ProviderTypeSearchPage
      title="Preschool Search"
      description="Search high-quality preschools in your area."
      intro="Filter by age group, curriculum approach, opening hours, and more to find the perfect preschool match."
      defaultProviderType="preschool"
    />
  )
}

