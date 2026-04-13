import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { enrichProviderGooglePlaceCache } from "@/lib/google-place-enrichment"

type RefreshCandidate = {
  profile_id: string
  business_name: string | null
  address: string | null
  google_place_id: string | null
  google_reviews_cached_at: string | null
}

const MONTHLY_REFRESH_LIMIT = 50
const STALE_CACHE_DAYS = 30

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = request.headers.get("authorization")?.trim() ?? ""
  return header === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const admin = getSupabaseAdminClient()
  const staleBeforeIso = new Date(Date.now() - STALE_CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error } = await admin
    .from("provider_profiles")
    .select("profile_id, business_name, address, google_place_id, google_reviews_cached_at")
    .eq("listing_status", "active")
    .not("google_place_id", "is", null)
    .order("google_reviews_cached_at", { ascending: true, nullsFirst: true })
    .limit(500)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const candidates = ((rows ?? []) as RefreshCandidate[])
    .filter((row) => {
      const cachedAt = row.google_reviews_cached_at?.trim()
      if (!cachedAt) return true
      const cachedTs = Date.parse(cachedAt)
      if (!Number.isFinite(cachedTs)) return true
      return cachedTs < Date.parse(staleBeforeIso)
    })
    .slice(0, MONTHLY_REFRESH_LIMIT)
  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, updated: 0 })
  }

  const profileIds = candidates.map((row) => row.profile_id)
  const { data: primaryPhotos } = await admin
    .from("provider_photos")
    .select("provider_profile_id")
    .in("provider_profile_id", profileIds)
    .eq("is_primary", true)

  const hasPrimaryByProfile = new Set((primaryPhotos ?? []).map((row) => row.provider_profile_id))

  let updated = 0
  for (const row of candidates) {
    const result = await enrichProviderGooglePlaceCache({
      providerProfileId: row.profile_id,
      businessName: row.business_name ?? "",
      address: row.address ?? "",
      placeId: row.google_place_id,
      hasPrimaryPhoto: hasPrimaryByProfile.has(row.profile_id),
      logContext: "cron-google-place-refresh",
    })
    if (result.ok && result.persisted) {
      updated += 1
    }
  }

  return NextResponse.json({
    ok: true,
    processed: candidates.length,
    updated,
    staleBeforeIso,
  })
}
