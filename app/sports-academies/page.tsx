import type { Metadata } from "next"
import { ProviderTypeSearchPage } from "@/components/provider-type-search-page"

export const metadata: Metadata = {
  title: "Children's Sports Academies | Early Learning Directory",
  description:
    "Discover sports academies and clubs for children, from football and gymnastics to swimming and more.",
}

export default function SportsAcademiesSearchPage() {
  return (
    <ProviderTypeSearchPage
      title="Sports Academies for Children"
      description="Search local sports academies and clubs designed for children of all ages."
      intro="Filter by sport, age group, and schedule to find the right sports academy for your child."
      defaultProviderType="sports_academy"
    />
  )
}

