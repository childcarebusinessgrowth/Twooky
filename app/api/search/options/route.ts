import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { getProviderTaxonomy } from "@/lib/provider-taxonomy"

type Option = { value: string; label: string; id?: string; slug?: string | null }

function normalizeAgeTag(tag: string): string {
  return tag === "school_age" ? "schoolage" : tag
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    const taxonomy = await getProviderTaxonomy()

    const [
      { data: ageGroups, error: ageGroupsError },
      { data: programTypes, error: programTypesError },
    ] =
      await Promise.all([
        supabase
          .from("age_groups")
          .select("id, tag, age_range")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("age_range", { ascending: true }),
        supabase
          .from("program_types")
          .select("id, name, slug")
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
        return {
          value: row.age_range.trim(),
          label: row.age_range.trim(),
          id: normalizeAgeTag(row.tag),
        }
      })

    const programTypeOptions: Option[] = (programTypes ?? []).map((row) => ({
      id: row.id,
      value: row.name,
      label: row.name,
      slug: row.slug ?? null,
    }))

    return NextResponse.json(
      {
        ageGroups: ageGroupOptions,
        programTypes: programTypeOptions,
        providerTaxonomy: taxonomy,
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
      { ageGroups: [], programTypes: [], providerTaxonomy: { categories: [], providerTypes: [] } },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=120",
        },
      },
    )
  }
}

