export function formatAgeGroupLabel(value: string): string {
  const lower = value.trim().toLowerCase()
  const map: Record<string, string> = {
    infant: "Infants",
    toddler: "Toddlers",
    preschool: "Preschool",
    prek: "Pre-K",
    school: "School Age",
    schoolage: "School Age",
    school_age: "School Age",
  }
  return map[lower] ?? value.charAt(0).toUpperCase() + value.slice(1)
}

/** Map age_groups_served to program-type display labels for provider cards and public profile. */
export function ageGroupsToProgramLabels(ageGroups: string[] | null): string[] {
  if (!ageGroups?.length) return []
  const labelMap: Record<string, string> = {
    infant: "Infant Care",
    toddler: "Toddler Care",
    preschool: "Preschool",
    prek: "Pre-K",
    school_age: "After School",
    schoolage: "After School",
  }
  const seen = new Set<string>()
  return ageGroups
    .map((g) => labelMap[g.trim().toLowerCase()] ?? formatAgeGroupLabel(g))
    .filter((label) => {
      if (seen.has(label)) return false
      seen.add(label)
      return true
    })
}
