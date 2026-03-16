import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { resolveGooglePlaceIdFromText } from "@/lib/google-place-id"

type ResolvePlaceIdBody = {
  businessName?: string
  address?: string
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
    if (resolution.role !== "provider") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as ResolvePlaceIdBody
    const businessName = body.businessName?.trim() ?? ""
    const address = body.address?.trim() ?? ""

    if (!businessName || !address) {
      return NextResponse.json({ placeId: null })
    }

    const placeId = await resolveGooglePlaceIdFromText(businessName, address)
    return NextResponse.json({ placeId })
  } catch {
    return NextResponse.json({ placeId: null })
  }
}
