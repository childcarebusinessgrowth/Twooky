import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { getProfileRoleForUser } from "@/lib/authz"

export async function GET() {
  try {
    const requestClient = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await requestClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ connected: false, message: "Unauthorized." }, { status: 401 })
    }

    const role = await getProfileRoleForUser(requestClient, user)
    if (role !== "admin") {
      return NextResponse.json({ connected: false, message: "Forbidden." }, { status: 403 })
    }

    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    })

    if (error) {
      return NextResponse.json(
        {
          connected: false,
          message: "Supabase connection failed.",
          error: process.env.NODE_ENV === "production" ? "Internal error." : error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        connected: true,
        message: "Supabase backend connection is healthy.",
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        message: "Supabase backend connection failed.",
        error: process.env.NODE_ENV === "production" ? "Internal error." : error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
