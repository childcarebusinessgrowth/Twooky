import { NextResponse } from "next/server"
import { resolveRoleForUser } from "@/lib/authz"
import { notifyProviderNewReview } from "@/lib/email/providerReviewNotification"
import { createReview } from "@/lib/parent-engagement"
import { buildReviewNotification, insertProviderNotification } from "@/lib/providerNotifications"
import { publicMessageForError } from "@/lib/publicErrors"
import { createSupabaseServerClient } from "@/lib/supabaseServer"

type CreateReviewPayload = {
  providerProfileId?: string
  rating?: number
  text?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolution = await resolveRoleForUser(supabase, user)
    if (resolution.role !== "parent") {
      return NextResponse.json({ error: "Only parents can create reviews." }, { status: 403 })
    }

    const body = (await request.json()) as CreateReviewPayload
    const providerProfileId =
      typeof body.providerProfileId === "string" ? body.providerProfileId.trim() : ""
    const rating = typeof body.rating === "number" ? body.rating : Number.NaN
    const text = typeof body.text === "string" ? body.text : ""

    if (!providerProfileId) {
      return NextResponse.json({ error: "Provider is required." }, { status: 400 })
    }

    if (!Number.isFinite(rating)) {
      return NextResponse.json({ error: "Rating is required." }, { status: 400 })
    }

    const { data: providerRow, error: providerLookupError } = await supabase
      .from("provider_profiles")
      .select("profile_id")
      .eq("profile_id", providerProfileId)
      .maybeSingle()

    if (providerLookupError) {
      console.error("Provider review lookup error:", providerLookupError)
      return NextResponse.json(
        { error: publicMessageForError(providerLookupError, "Failed to submit review.") },
        { status: 500 }
      )
    }

    if (!providerRow) {
      return NextResponse.json({ error: "Provider not found." }, { status: 404 })
    }

    const result = await createReview(supabase, user.id, providerProfileId, rating, text)

    if (result.error) {
      return NextResponse.json(
        { error: publicMessageForError(new Error(result.error), "Failed to submit review.") },
        { status: 400 }
      )
    }

    if (result.isNew && result.reviewId) {
      const { data: parentProfile, error: parentProfileError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()

      if (parentProfileError) {
        console.error("Parent profile lookup failed for review email:", parentProfileError)
      }

      void notifyProviderNewReview({
        providerProfileId,
        reviewId: result.reviewId,
        rating,
        reviewText: text,
        fromName: parentProfile?.display_name?.trim() || null,
      })
      void insertProviderNotification(
        buildReviewNotification({
          providerProfileId,
          reviewId: result.reviewId,
          rating,
          reviewText: text,
          fromName: parentProfile?.display_name?.trim() || null,
        })
      )
    }

    return NextResponse.json(
      {
        reviewId: result.reviewId,
        isNew: result.isNew,
      },
      { status: result.isNew ? 201 : 200 }
    )
  } catch (error) {
    console.error("Create review API error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
