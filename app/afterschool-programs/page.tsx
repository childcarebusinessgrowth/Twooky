import type { Metadata } from "next"
import { ProviderTypeSearchPage } from "@/components/provider-type-search-page"

export const metadata: Metadata = {
  title: "Afterschool Programs Near You | Early Learning Directory",
  description:
    "Find afterschool programs that support homework, enrichment, and safe care for school-age children.",
}

export default function AfterschoolProgramsSearchPage() {
  return (
    <ProviderTypeSearchPage
      title="Afterschool Program Search"
      description="Search afterschool clubs and programs offering safe, structured care outside school hours."
      intro="Compare afterschool programs by schedule, activities, fees, and reviews to find the best option for your family."
      defaultProviderType="afterschool_program"
    />
  )
}

