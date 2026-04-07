"use server"

import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { notifyFavoritingParentsOfAvailabilityChange } from "@/lib/email/favoriteProviderAvailabilityNotification"

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

  const { data, error } = await supabase
    .from("provider_profiles")
    .select("availability_status, available_spots_count")
    .eq("profile_id", user.id)
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

  return {
    data: {
      availabilityStatus,
      availableSpotsCount: data.available_spots_count ?? null,
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

  const normalizedSpots =
    input.availabilityStatus === "openings"
      ? Number.isInteger(input.availableSpotsCount) && (input.availableSpotsCount ?? 0) > 0
        ? input.availableSpotsCount
        : null
      : null

  if (input.availabilityStatus === "openings" && normalizedSpots == null) {
    return { error: "Enter a valid number of available spots greater than 0." }
  }

  const { data: existingRow } = await supabase
    .from("provider_profiles")
    .select("availability_status")
    .eq("profile_id", user.id)
    .maybeSingle()

  const previousStatus = normalizeAvailabilityStatus(existingRow?.availability_status ?? null)

  const { error } = await supabase.from("provider_profiles").upsert(
    {
      profile_id: user.id,
      availability_status: input.availabilityStatus,
      available_spots_count: normalizedSpots,
    },
    { onConflict: "profile_id" },
  )

  if (error) return { error: error.message }

  const nextStatus = input.availabilityStatus
  if (nextStatus === "full" && previousStatus !== "full") {
    void notifyFavoritingParentsOfAvailabilityChange({
      providerProfileId: user.id,
      kind: "full",
    })
  }
  if (nextStatus === "waitlist" && previousStatus !== "waitlist") {
    void notifyFavoritingParentsOfAvailabilityChange({
      providerProfileId: user.id,
      kind: "waitlist",
    })
  }

  return {}
}
