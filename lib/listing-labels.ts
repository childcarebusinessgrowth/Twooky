import { PROVIDER_TYPES } from "@/lib/provider-types"
import { AGE_GROUPS, AMENITIES, CURRICULUM_OPTIONS } from "@/lib/listing-options"

export function getProviderTypeLabel(id: string): string {
  return PROVIDER_TYPES.find((t) => t.id === id)?.label ?? id
}

export function getAgeGroupLabel(id: string): string {
  return AGE_GROUPS.find((g) => g.id === id)?.label ?? id
}

export function getAmenityLabel(id: string): string {
  return AMENITIES.find((a) => a.id === id)?.label ?? id
}

export function getCurriculumLabel(id: string): string {
  const found = CURRICULUM_OPTIONS.find((c) => c.id === id || c.label.toLowerCase() === id.toLowerCase())
  return found?.label ?? (id.charAt(0).toUpperCase() + id.slice(1).toLowerCase().replace(/-/g, " "))
}
