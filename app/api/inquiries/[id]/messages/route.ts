import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { notifyParentOfFirstProviderReply } from "@/lib/email/parentFirstReplyNotification"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id: inquiryId } = await context.params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: rows, error: rpcError } = await supabase.rpc(
      "get_inquiry_thread",
      { p_inquiry_id: inquiryId }
    )

    if (rpcError) {
      console.error("get_inquiry_thread RPC error:", rpcError)
      return NextResponse.json(
        { error: "Failed to load messages." },
        { status: 500 }
      )
    }

    const messages = (rows ?? []).map(
      (r: {
        message_order: number
        sender_type: string
        sender_profile_id: string
        body_decrypted: string | null
        created_at: string
      }) => ({
        messageOrder: r.message_order,
        senderType: r.sender_type,
        senderProfileId: r.sender_profile_id,
        body: r.body_decrypted ?? "",
        createdAt: r.created_at,
      })
    )

    return NextResponse.json({ messages })
  } catch (e) {
    console.error("Get inquiry messages API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

type PostPayload = { message?: string }

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id: inquiryId } = await context.params
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json()) as PostPayload
    const message =
      typeof body.message === "string" ? body.message.trim() : ""

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      )
    }

    const { data: replyId, error: rpcError } = await supabase.rpc(
      "add_inquiry_reply",
      {
        p_inquiry_id: inquiryId,
        p_message_plain: message,
      }
    )

    if (rpcError) {
      console.error("add_inquiry_reply RPC error:", rpcError)
      return NextResponse.json(
        { error: rpcError.message ?? "Failed to send message." },
        { status: 500 }
      )
    }

    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
    void notifyParentOfFirstProviderReply({
      inquiryId,
      providerProfileId,
    })

    return NextResponse.json({ id: replyId }, { status: 201 })
  } catch (e) {
    console.error("Add inquiry reply API error:", e)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
