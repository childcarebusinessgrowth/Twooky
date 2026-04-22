import { PROVIDER_TYPES } from "@/lib/provider-types"
import type { MarketId } from "@/lib/market"
import { AGE_GROUPS, AMENITIES, CURRICULUM_OPTIONS } from "@/lib/listing-options"

export function getProviderTypeLabel(id: string): string {
  const found = PROVIDER_TYPES.find((t) => t.id === id)
  if (found) return found.label
  return id
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizePublicProviderTypeValue(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ")
}

export function getPublicProviderTypeLabel(id: string, market?: MarketId): string {
  const label = getProviderTypeLabel(id)
  if (market === "us") {
    const normalized = normalizePublicProviderTypeValue(id)
    if (normalized === "nursery" || normalized === "nurseries" || label === "Nursery" || label === "Nurseries") {
      return "Daycare"
    }
  }
  return label
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
