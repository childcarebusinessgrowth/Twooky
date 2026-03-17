/**
 * Stable ids and labels for provider listing form options.
 * Used for age groups and amenities so save/load use consistent values.
 */

export const AGE_GROUPS = [
  { id: "infant", label: "Infant (0-12 mo)" },
  { id: "toddler", label: "Toddler (1-2 yrs)" },
  { id: "preschool", label: "Preschool (3-4 yrs)" },
  { id: "prek", label: "Pre-K (4-5 yrs)" },
  { id: "school_age", label: "School Age (5+)" },
] as const

export type AgeGroupId = (typeof AGE_GROUPS)[number]["id"]

export const CURRICULUM_OPTIONS = [
  { id: "play-based", label: "Play-Based" },
  { id: "montessori", label: "Montessori" },
  { id: "reggio", label: "Reggio Emilia" },
  { id: "waldorf", label: "Waldorf" },
  { id: "academic", label: "Academic" },
  { id: "stem-focused", label: "STEM-Focused" },
] as const

export type CurriculumId = (typeof CURRICULUM_OPTIONS)[number]["id"]

export const AMENITIES = [
  { id: "meals_included", label: "Meals Included" },
  { id: "outdoor_play_area", label: "Outdoor Play Area" },
  { id: "nap_room", label: "Nap Room" },
  { id: "security_cameras", label: "Security Cameras" },
  { id: "parent_app", label: "Parent App" },
  { id: "transportation", label: "Transportation" },
] as const

export type AmenityId = (typeof AMENITIES)[number]["id"]
