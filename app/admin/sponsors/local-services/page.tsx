import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AdminLocalServicesClient } from "./pageClient"

export const dynamic = "force-dynamic"

export type AgeGroupOption = {
  id: string
  name: string
  age_range: string | null
}

export type LocalServiceDealRow = {
  id: string
  title: string
  description: string
  image_url: string
  location: string
  age_target: string
  provider_id: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export default async function AdminLocalServicesPage() {
  const supabase = getSupabaseAdminClient()

  const [{ data: deals, error: dealsError }, { data: ageGroups, error: ageError }] = await Promise.all([
    supabase.from("local_service_deals").select("*").order("created_at", { ascending: false }),
    supabase.from("age_groups").select("id, name, age_range").eq("is_active", true).order("sort_order", { ascending: true }),
  ])

  if (dealsError) {
    console.error("[admin/sponsors/local-services] deals", dealsError.message)
  }
  if (ageError) {
    console.error("[admin/sponsors/local-services] age_groups", ageError.message)
  }

  const rows = (deals ?? []) as LocalServiceDealRow[]
  const ids = [...new Set(rows.map((r) => r.provider_id))]
  let providerMap: Record<string, { business_name: string | null; city: string | null }> = {}

  if (ids.length > 0) {
    const { data: provs, error: pErr } = await supabase
      .from("provider_profiles")
      .select("profile_id, business_name, city")
      .in("profile_id", ids)

    if (pErr) {
      console.error("[admin/sponsors/local-services] providers", pErr.message)
    } else {
      providerMap = Object.fromEntries(
        (provs ?? []).map((p) => [
          p.profile_id,
          { business_name: p.business_name ?? null, city: p.city ?? null },
        ]),
      )
    }
  }

  const ageGroupOptions = ((ageGroups ?? []) as AgeGroupOption[]).filter((r) => r.name)

  return (
    <AdminLocalServicesClient
      initialRows={rows}
      providerMap={providerMap}
      ageGroups={ageGroupOptions}
    />
  )
}
