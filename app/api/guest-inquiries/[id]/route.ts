import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * GET a single guest inquiry (provider only). Returns decrypted message via RPC.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: guestId } = await context.params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: row, error: fetchError } = await supabase
      .from("guest_inquiries")
      .select("id, provider_profile_id, child_dob, ideal_start_date, first_name, last_name, email, telephone, created_at")
      .eq("id", guestId)
      .single()

    if (fetchError || !row) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 })
    }

    if (row.provider_profile_id !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    const { data: messageDecrypted } = await supabase.rpc("get_guest_inquiry_message_decrypted", {
      p_guest_inquiry_id: guestId,
    })

    return NextResponse.json({
      id: row.id,
      childDob: row.child_dob,
      idealStartDate: row.ideal_start_date,
      message: messageDecrypted ?? "",
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      telephone: row.telephone,
      createdAt: row.created_at,
    })
  } catch (e) {
    console.error("Get guest inquiry API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
