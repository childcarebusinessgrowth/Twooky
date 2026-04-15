import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { resolveRoleForUser } from "@/lib/authz"
import { deriveProviderSlug } from "@/lib/provider-slug"
import { normalizeProviderWebsiteUrl } from "@/lib/normalize-provider-website-url"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"
import { syncProviderProgramTypes } from "@/lib/provider-program-types"
import { revalidateProviderDirectoryCaches } from "@/lib/revalidate-public-directory"

function uniqueTrimmedStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readOptionalInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const resolution = await resolveRoleForUser(supabase, user)
    if (resolution.role !== "provider") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 })
    }

    const businessName = readOptionalString(body.businessName)
    if (!businessName) {
      return NextResponse.json({ success: false, error: "Business name is required." }, { status: 400 })
    }

    const submitForReview = body.submitForReview === true
    const admin = getSupabaseAdminClient()
    const planAccess = await getProviderPlanAccessForUser(supabase, user.id)

    const { data: existingProfile, error: existingProfileError } = await admin
      .from("provider_profiles")
      .select("listing_status")
      .eq("profile_id", planAccess.providerProfileId)
      .maybeSingle()

    if (existingProfileError) {
      return NextResponse.json({ success: false, error: existingProfileError.message }, { status: 400 })
    }

    const providerProfileId = planAccess.providerProfileId
    const existingListingStatus = existingProfile?.listing_status ?? null

    if (existingListingStatus === "pending") {
      return NextResponse.json(
        { success: false, error: "Your profile is under review. Editing is locked until admin approval." },
        { status: 403 }
      )
    }

    const normalizedVirtualTourUrls = uniqueTrimmedStrings(body.virtualTourUrls)
    const normalizedProviderTypes = uniqueTrimmedStrings(body.providerTypes)
    const normalizedAgeGroupsServed = uniqueTrimmedStrings(body.ageGroupsServed)
    const normalizedCurriculumTypes = uniqueTrimmedStrings(body.curriculumTypes)
    const normalizedAmenities = uniqueTrimmedStrings(body.amenities)

    if (normalizedProviderTypes.length === 0) {
      return NextResponse.json({ success: false, error: "Select at least one provider type." }, { status: 400 })
    }

    if (planAccess.canAccessEnhancedListing) {
      const programTypeIds = uniqueTrimmedStrings(body.programTypeIds)
      if (programTypeIds.length === 0) {
        return NextResponse.json({ success: false, error: "Select at least one program type." }, { status: 400 })
      }

      const { error: saveError } = await admin.from("provider_profiles" as never).upsert(
        {
          profile_id: providerProfileId,
          owner_profile_id: user.id,
          ...(submitForReview ? { listing_status: "pending" } : {}),
          provider_slug: deriveProviderSlug(businessName),
          business_name: businessName,
          virtual_tour_url: normalizedVirtualTourUrls[0] ?? null,
          virtual_tour_urls: normalizedVirtualTourUrls.length > 0 ? normalizedVirtualTourUrls : null,
          description: readOptionalString(body.description),
          phone: readOptionalString(body.phone),
          website: normalizeProviderWebsiteUrl(readOptionalString(body.website) ?? ""),
          google_place_id: readOptionalString(body.googlePlaceId),
          address: readOptionalString(body.address),
          provider_types: normalizedProviderTypes.length > 0 ? normalizedProviderTypes : null,
          age_groups_served: normalizedAgeGroupsServed.length > 0 ? normalizedAgeGroupsServed : null,
          curriculum_type: normalizedCurriculumTypes.length > 0 ? normalizedCurriculumTypes : null,
          languages_spoken: readOptionalString(body.languagesSpoken),
          amenities: normalizedAmenities.length > 0 ? normalizedAmenities : null,
          opening_time: readOptionalString(body.openingTime),
          closing_time: readOptionalString(body.closingTime),
          daily_fee_from: readOptionalInteger(body.dailyFeeFrom),
          daily_fee_to: readOptionalInteger(body.dailyFeeTo),
          registration_fee: readOptionalInteger(body.registrationFee),
          deposit_fee: readOptionalInteger(body.depositFee),
          meals_fee: readOptionalInteger(body.mealsFee),
          service_transport: body.serviceTransport === true,
          service_extended_hours: body.serviceExtendedHours === true,
          service_pickup_dropoff: body.servicePickupDropoff === true,
          service_extracurriculars: body.serviceExtracurriculars === true,
          currency_id: readOptionalString(body.currencyId),
          total_capacity: readOptionalInteger(body.totalCapacity),
        } as never,
        { onConflict: "profile_id" }
      )

      if (saveError) {
        return NextResponse.json({ success: false, error: saveError.message }, { status: 400 })
      }

      const syncProgramTypesResult = await syncProviderProgramTypes(admin, providerProfileId, programTypeIds)
      if (syncProgramTypesResult.error) {
        return NextResponse.json({ success: false, error: syncProgramTypesResult.error }, { status: 400 })
      }
    } else {
      const address = readOptionalString(body.address)
      if (!address) {
        return NextResponse.json({ success: false, error: "Location is required." }, { status: 400 })
      }

      const { error: saveError } = await admin.from("provider_profiles" as never).upsert(
        {
          profile_id: providerProfileId,
          owner_profile_id: user.id,
          ...(submitForReview ? { listing_status: "pending" } : {}),
          provider_slug: deriveProviderSlug(businessName),
          business_name: businessName,
          google_place_id: readOptionalString(body.googlePlaceId),
          address,
          provider_types: normalizedProviderTypes,
        } as never,
        { onConflict: "profile_id" }
      )

      if (saveError) {
        return NextResponse.json({ success: false, error: saveError.message }, { status: 400 })
      }
    }

    revalidatePath("/dashboard/provider/listing")
    revalidatePath("/dashboard/provider")
    revalidatePath("/search")
    revalidatePath("/")
    revalidateProviderDirectoryCaches()
    const providerSlug = deriveProviderSlug(businessName)
    if (providerSlug) {
      revalidatePath(`/providers/${providerSlug}`)
    }

    return NextResponse.json({ success: true, providerProfileId })
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
