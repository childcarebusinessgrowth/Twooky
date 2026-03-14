import type { Metadata } from "next"
import { ProviderTypeSearchPage } from "@/components/provider-type-search-page"

export const metadata: Metadata = {
  title: "Tutoring and Academic Support | Early Learning Directory",
  description:
    "Find tutors and academic support services for children, covering core subjects, exam prep, and enrichment.",
}

export default function TutoringSearchPage() {
  return (
    <ProviderTypeSearchPage
      title="Tutoring and Academic Support"
      description="Search local and online tutoring services for children."
      intro="Filter by subject, level, and format to find the right tutor for your child."
      defaultProviderType="tutoring"
    />
  )
}

