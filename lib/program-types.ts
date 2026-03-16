import {
  Baby,
  Footprints,
  GraduationCap,
  Blocks,
  Home,
  Backpack,
  Heart,
} from "lucide-react"
import type { ComponentType } from "react"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

export const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Baby,
  Footprints,
  GraduationCap,
  Blocks,
  Home,
  Backpack,
  Heart,
}

export const ageGroupLabelMap: Record<string, string> = {
  "infant-care": "6 weeks - 12 months",
  "toddler-care": "1-2 years",
  preschool: "3-5 years",
  montessori: "Mixed age groups",
  "home-daycare": "Small group care",
  "after-school": "5-12 years",
  "special-needs": "Inclusive support",
}

export interface ProgramTypeRow {
  id: string
  name: string
  slug: string | null
  short_description: string | null
  about_text: string | null
  key_benefits: string[] | null
  age_group_ids: string[] | null
  sort_order: number
  is_active: boolean
}

export interface AgeGroupRow {
  id: string
  name: string
  age_range: string | null
  sort_order: number
}

export interface ProgramTypeFaqRow {
  id: string
  question: string
  answer: string
  sort_order: number
}

export interface ProgramCardData {
  id: string
  slug: string
  title: string
  icon: string
  shortDescription: string
  ageGroupLabel: string
}

export interface ProgramDetailData {
  id: string
  slug: string
  title: string
  shortDescription: string
  aboutText: string
  keyBenefits: string[]
  faqs: Array<{ question: string; answer: string }>
}

export function slugToIcon(slug: string): string {
  const iconBySlug: Record<string, string> = {
    "infant-care": "Baby",
    "toddler-care": "Footprints",
    preschool: "GraduationCap",
    montessori: "Blocks",
    "home-daycare": "Home",
    "after-school": "Backpack",
    "special-needs": "Heart",
  }
  return iconBySlug[slug] ?? "Baby"
}

export function programTypeToCardShape(
  row: ProgramTypeRow,
  ageGroupsById?: Map<string, AgeGroupRow>
): ProgramCardData {
  const slug = row.slug ?? slugFromName(row.name)
  const ageGroupLabel = buildAgeGroupLabelFromDb(row.age_group_ids, ageGroupsById) ??
    ageGroupLabelMap[slug] ??
    "All ages"
  return {
    id: row.id,
    slug,
    title: row.name,
    icon: slugToIcon(slug),
    shortDescription: row.short_description ?? "",
    ageGroupLabel,
  }
}

function buildAgeGroupLabelFromDb(
  ageGroupIds: string[] | null | undefined,
  ageGroupsById?: Map<string, AgeGroupRow>
): string | null {
  if (!ageGroupIds?.length || !ageGroupsById?.size) return null
  const groups = ageGroupIds
    .map((id) => ageGroupsById.get(id))
    .filter((ag): ag is AgeGroupRow => !!ag)
    .sort((a, b) => a.sort_order - b.sort_order)
  const labels = groups.map((ag) => ag.age_range?.trim() || ag.name)
  return labels.length > 0 ? labels.join(", ") : null
}

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function getActiveProgramTypes(): Promise<ProgramTypeRow[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("program_types")
    .select("id, name, slug, short_description, about_text, key_benefits, age_group_ids, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("[program-types] Failed to fetch active program types", error)
    return []
  }

  return (data ?? []) as ProgramTypeRow[]
}

export async function getAgeGroupsById(): Promise<Map<string, AgeGroupRow>> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("age_groups")
    .select("id, name, age_range, sort_order")
    .eq("is_active", true)

  if (error) {
    console.error("[program-types] Failed to fetch age groups", error)
    return new Map()
  }

  const rows = (data ?? []) as AgeGroupRow[]
  return new Map(rows.map((r) => [r.id, r]))
}

export async function getProgramTypeBySlug(
  slug: string,
  options?: { includeFaqs?: boolean }
): Promise<(ProgramTypeRow & { faqs?: ProgramTypeFaqRow[] }) | null> {
  const supabase = getSupabaseAdminClient()

  const { data: row, error } = await supabase
    .from("program_types")
    .select("id, name, slug, short_description, about_text, key_benefits, sort_order, is_active")
    .eq("is_active", true)
    .eq("slug", slug)
    .maybeSingle()

  if (error || !row) {
    return null
  }

  const typed = row as ProgramTypeRow

  if (options?.includeFaqs) {
    const { data: faqs } = await supabase
      .from("program_type_faqs")
      .select("id, question, answer, sort_order")
      .eq("program_type_id", typed.id)
      .order("sort_order", { ascending: true })

    return { ...typed, faqs: (faqs ?? []) as ProgramTypeFaqRow[] }
  }

  return typed
}

export async function getProgramTypeNameBySlug(slug: string): Promise<string | null> {
  const row = await getProgramTypeBySlug(slug)
  return row?.name ?? null
}
