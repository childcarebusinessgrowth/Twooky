export type ProviderTypeId =
  | "nursery"
  | "preschool"
  | "afterschool_program"
  | "sports_academy"
  | "holiday_camp"
  | "tutoring"
  | "therapy_service"

export interface ProviderType {
  id: ProviderTypeId
  label: string
  description?: string
}

export const PROVIDER_TYPES: ProviderType[] = [
  {
    id: "nursery",
    label: "Nursery",
    description: "Care and early learning for babies and toddlers.",
  },
  {
    id: "preschool",
    label: "Preschool",
    description: "Early learning programs focused on kindergarten readiness.",
  },
  {
    id: "afterschool_program",
    label: "Afterschool Program",
    description: "Care and enrichment for school-age children outside school hours.",
  },
  {
    id: "sports_academy",
    label: "Sports Academy",
    description: "Skill-building sports and physical activity programs.",
  },
  {
    id: "holiday_camp",
    label: "Holiday Camp",
    description: "Seasonal camps and holiday programs.",
  },
  {
    id: "tutoring",
    label: "Tutoring",
    description: "Academic tutoring and homework support services.",
  },
  {
    id: "therapy_service",
    label: "Therapy Services",
    description: "Specialist therapy services such as speech or occupational therapy.",
  },
]

export function getProviderTypeById(id: ProviderTypeId): ProviderType | undefined {
  return PROVIDER_TYPES.find((type) => type.id === id)
}

