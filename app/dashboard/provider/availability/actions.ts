"use server"

import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { notifyFavoritingParentsOfAvailabilityChange } from "@/lib/email/favoriteProviderAvailabilityNotification"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"

export type ProviderAvailabilityStatus = "openings" | "waitlist" | "full"

export type ProviderAvailabilityData = {
  availabilityStatus: ProviderAvailabilityStatus
  availableSpotsCount: number | null
}

export async function getProviderAvailability(): Promise<{
  data: ProviderAvailabilityData | null
  error?: string
}> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: userError?.message ?? "Not authenticated" }
  }
  const { providerProfileId, canAccessAvailability } = await getProviderPlanAccessForUser(supabase, user.id)
  if (!canAccessAvailability) {
    return { data: null, error: "Availability is not available on the Sprout plan." }
  }

  const { data, error } = await supabase
    .from("provider_profiles")
    .select("availability_status, available_spots_count, total_capacity")
    .eq("profile_id", providerProfileId)
    .maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!data) {
    return {
      data: {
        availabilityStatus: "openings",
        availableSpotsCount: null,
      },
    }
  }

  const availabilityStatus: ProviderAvailabilityStatus =
    data.availability_status === "waitlist" || data.availability_status === "full"
      ? data.availability_status
      : "openings"
  const availableSpotsCount =
    availabilityStatus === "openings" && data.available_spots_count == null
      ? data.total_capacity ?? null
      : data.available_spots_count ?? null

  return {
    data: {
      availabilityStatus,
      availableSpotsCount,
    },
  }
}

function normalizeAvailabilityStatus(
  raw: string | null | undefined
): ProviderAvailabilityStatus {
  if (raw === "waitlist" || raw === "full") return raw
  return "openings"
}

export async function updateProviderAvailability(input: {
  availabilityStatus: ProviderAvailabilityStatus
  availableSpotsCount: number | null
}): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: userError?.message ?? "Not authenticated" }
  }
  const { providerProfileId, canAccessAvailability } = await getProviderPlanAccessForUser(supabase, user.id)
  if (!canAccessAvailability) {
    return { error: "Availability is not available on the Sprout plan." }
  }

  const normalizedSpots =
    input.availabilityStatus === "openings"
      ? Number.isInteger(input.availableSpotsCount) && (input.availableSpotsCount ?? 0) > 0
        ? input.availableSpotsCount
        : null
      : null

  if (input.availabilityStatus === "openings" && normalizedSpots == null) {
    return { error: "Enter a valid number of available spots greater than 0." }
  }

  const admin = getSupabaseAdminClient()

  const { data: existingRow } = await admin
    .from("provider_profiles")
    .select("availability_status")
    .eq("profile_id", providerProfileId)
    .maybeSingle()

  const previousStatus = normalizeAvailabilityStatus(existingRow?.availability_status ?? null)

  const { data: updatedRow, error } = await admin
    .from("provider_profiles" as never)
    .upsert(
      {
        profile_id: providerProfileId,
        owner_profile_id: user.id,
        availability_status: input.availabilityStatus,
        available_spots_count: normalizedSpots,
      } as never,
      { onConflict: "profile_id" }
    )
    .select("profile_id")
    .maybeSingle()

  if (error) return { error: error.message }
  if (!updatedRow) return { error: "Unable to save provider availability." }

  const nextStatus = input.availabilityStatus
  if (nextStatus === "full" && previousStatus !== "full") {
    void notifyFavoritingParentsOfAvailabilityChange({
      providerProfileId,
      kind: "full",
    })
  }
  if (nextStatus === "waitlist" && previousStatus !== "waitlist") {
    void notifyFavoritingParentsOfAvailabilityChange({
      providerProfileId,
      kind: "waitlist",
    })
  }

  return {}
}
