import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

type Option = { value: string; label: string }

function normalizeAgeTag(tag: string): string {
  return tag === "school_age" ? "schoolage" : tag
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()

    const [{ data: ageGroups, error: ageGroupsError }, { data: programTypes, error: programTypesError }] =
      await Promise.all([
        supabase
          .from("age_groups")
          .select("id, tag, age_range")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("age_range", { ascending: true }),
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
        const tag = normalizeAgeTag(row.tag)
        return { value: tag, label: row.age_range }
      })

    const programTypeOptions: Option[] = (programTypes ?? []).map((row) => ({
      value: row.name,
      label: row.name,
    }))

    return NextResponse.json(
      {
        ageGroups: ageGroupOptions,
        programTypes: programTypeOptions,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("[search-options] Unexpected error", error)
    return NextResponse.json(
      { ageGroups: [], programTypes: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=120",
        },
      },
    )
  }
}

