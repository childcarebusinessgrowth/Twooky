import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

type Option = { value: string; label: string }

function ageGroupNameToTag(name: string): string | null {
  const lower = name.trim().toLowerCase()
  const map: Record<string, string> = {
    infant: "infant",
    toddler: "toddler",
    preschool: "preschool",
    "pre-k": "prek",
    prek: "prek",
    "school age": "schoolage",
    schoolage: "schoolage",
  }
  return map[lower] ?? null
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()

    const [{ data: ageGroups, error: ageGroupsError }, { data: programTypes, error: programTypesError }] =
      await Promise.all([
        supabase
          .from("age_groups")
          .select("id, name, age_range")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("program_types")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
      ])

    if (ageGroupsError) {
      console.error("[search-options] Failed to load age groups", ageGroupsError)
    }
    if (programTypesError) {
      console.error("[search-options] Failed to load program types", programTypesError)
    }

    const ageGroupOptions: Option[] = (ageGroups ?? [])
      .map((row) => {
        const tag = ageGroupNameToTag(row.name)
        if (!tag) return null
        const label = row.age_range ? `${row.name} (${row.age_range})` : row.name
        return { value: tag, label }
      })
      .filter((x): x is Option => !!x)

    const programTypeOptions: Option[] = (programTypes ?? []).map((row) => ({
      value: row.name,
      label: row.name,
    }))

    return NextResponse.json({
      ageGroups: ageGroupOptions,
      programTypes: programTypeOptions,
    })
  } catch (error) {
    console.error("[search-options] Unexpected error", error)
    return NextResponse.json({ ageGroups: [], programTypes: [] }, { status: 200 })
  }
}

