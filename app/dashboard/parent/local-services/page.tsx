import { RequireAuth } from "@/components/RequireAuth"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  ParentLocalServicesClient,
  type ParentAgeGroupOption,
  type ParentLocalServiceDeal,
} from "./ParentLocalServicesClient"

export const dynamic = "force-dynamic"

function pickProviderSlug(
  row: Record<string, unknown>
): string | null {
  const raw = row.provider_profiles
  if (!raw) return null
  if (Array.isArray(raw)) {
    const slug = raw[0] && typeof raw[0] === "object" && raw[0] !== null && "provider_slug" in raw[0]
      ? String((raw[0] as { provider_slug?: string }).provider_slug ?? "")
      : ""
    return slug || null
  }
  if (typeof raw === "object" && raw !== null && "provider_slug" in raw) {
    const s = (raw as { provider_slug?: string }).provider_slug
    return s?.trim() ? s : null
  }
  return null
}

export default async function ParentLocalServicesPage() {
  const supabase = await createSupabaseServerClient()

  const [dealsRes, agesRes] = await Promise.all([
    supabase
      .from("local_service_deals")
      .select(
        `
        id,
        title,
        description,
        image_url,
        location,
        age_target,
        provider_id,
        created_at,
        provider_profiles ( provider_slug )
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("age_groups")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ])

  const loadError =
    dealsRes.error?.message || agesRes.error?.message
      ? [dealsRes.error?.message, agesRes.error?.message].filter(Boolean).join(" ")
      : null

  const rawDeals = (dealsRes.data ?? []) as Record<string, unknown>[]
  const deals: ParentLocalServiceDeal[] = rawDeals.map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    imageUrl: String(row.image_url ?? ""),
    location: String(row.location ?? ""),
    ageTarget: String(row.age_target ?? ""),
    providerSlug: pickProviderSlug(row),
  }))

  const ageGroups: ParentAgeGroupOption[] = (agesRes.data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    sortOrder: g.sort_order,
  }))

  return (
    <RequireAuth>
      <ParentLocalServicesClient deals={deals} ageGroups={ageGroups} loadError={loadError} />
    </RequireAuth>
  )
}
