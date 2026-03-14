import type { Metadata } from "next"
import { ProviderTypeSearchPage } from "@/components/provider-type-search-page"

export const metadata: Metadata = {
  title: "Children's Therapy Services | Early Learning Directory",
  description:
    "Search for children's therapy services including speech and language therapy, occupational therapy, counselling, and more.",
}

export default function TherapyServicesSearchPage() {
  return (
    <ProviderTypeSearchPage
      title="Therapy Services for Children"
      description="Find specialist therapy services to support your child's development and wellbeing."
      intro="Search for speech and language therapists, occupational therapists, counsellors, and more."
      defaultProviderType="therapy_service"
    />
  )
}

