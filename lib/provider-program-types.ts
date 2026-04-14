import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabaseDatabase"

type TypedClient = SupabaseClient<Database>

export type ProviderProgramType = {
  id: string
  name: string
  slug: string | null
}

export async function getProviderProgramTypesByProfileIds(
  supabase: TypedClient,
  profileIds: string[]
): Promise<Record<string, ProviderProgramType[]>> {
  if (profileIds.length === 0) return {}

  const uniqueProfileIds = Array.from(new Set(profileIds.filter(Boolean)))
  if (uniqueProfileIds.length === 0) return {}

  const { data: linkRows, error: linkError } = await supabase
    .from("provider_profile_program_types")
    .select("provider_profile_id, program_type_id")
    .in("provider_profile_id", uniqueProfileIds)

  if (linkError || !linkRows?.length) return {}

  const programTypeIds = Array.from(
    new Set(linkRows.map((row) => row.program_type_id).filter(Boolean))
  )
  if (programTypeIds.length === 0) return {}

  const { data: programTypeRows, error: programTypeError } = await supabase
    .from("program_types")
    .select("id, name, slug, sort_order")
    .in("id", programTypeIds)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  if (programTypeError || !programTypeRows?.length) return {}

  const programTypeById = new Map(
    programTypeRows.map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        slug: row.slug ?? null,
      } satisfies ProviderProgramType,
    ])
  )
  const programTypeOrder = new Map(programTypeRows.map((row, index) => [row.id, index]))

  const byProfile = new Map<string, ProviderProgramType[]>()
  for (const linkRow of linkRows) {
    const programType = programTypeById.get(linkRow.program_type_id)
    if (!programType) continue
    const current = byProfile.get(linkRow.provider_profile_id) ?? []
    if (!current.some((item) => item.id === programType.id)) {
      current.push(programType)
      byProfile.set(linkRow.provider_profile_id, current)
    }
  }

  const result: Record<string, ProviderProgramType[]> = {}
  for (const profileId of uniqueProfileIds) {
    const selected = byProfile.get(profileId) ?? []
    result[profileId] = [...selected].sort(
      (a, b) =>
        (programTypeOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (programTypeOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER) ||
        a.name.localeCompare(b.name)
    )
  }

  return result
}

export async function syncProviderProgramTypes(
  supabase: TypedClient,
  profileId: string,
  programTypeIds: string[]
): Promise<{ error: string | null }> {
  const uniqueProgramTypeIds = Array.from(
    new Set(programTypeIds.map((value) => value.trim()).filter(Boolean))
  )

  const { error: deleteError } = await supabase
    .from("provider_profile_program_types")
    .delete()
    .eq("provider_profile_id", profileId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  if (uniqueProgramTypeIds.length === 0) {
    return { error: null }
  }

  const { error: insertError } = await supabase
    .from("provider_profile_program_types")
    .insert(
      uniqueProgramTypeIds.map((programTypeId) => ({
        provider_profile_id: profileId,
        program_type_id: programTypeId,
      }))
    )

  if (insertError) {
    return { error: insertError.message }
  }

  return { error: null }
}
