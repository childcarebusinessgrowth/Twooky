import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"

const DOC_TYPES = ["Business License", "ID Verification", "Utility Bill", "Other"]

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

    const body = await request.json()
    const docType = DOC_TYPES.includes(body.document_type) ? body.document_type : "Other"
    const documents = Array.isArray(body.documents) ? body.documents : []
    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)

    const admin = getSupabaseAdminClient()
    for (const doc of documents) {
      const { error: docErr } = await admin
        .from("provider_listing_documents")
        .insert({
          provider_profile_id: providerProfileId,
          document_type: docType,
          storage_path: doc.path,
          mime_type: doc.mime_type,
          file_size: doc.file_size,
        })
      if (docErr) {
        return NextResponse.json({
          success: false,
          error: `Failed to save document record: ${docErr.message}`,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
