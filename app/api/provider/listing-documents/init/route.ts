import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { resolveRoleForUser } from "@/lib/authz"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import {
  PROVIDER_DOCUMENTS_BUCKET,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/provider-documents-constants"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

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
    const files = (Array.isArray(body.files) ? body.files : []).filter(
      (f: { name?: string; size?: number; type?: string }) =>
        f && (f.size ?? 0) > 0 && f.name
    )

    if (files.length === 0) {
      return NextResponse.json({
        success: false,
        error: "At least one verification document is required.",
      })
    }

    for (const f of files) {
      if ((f.size ?? 0) > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({
          success: false,
          error: `File "${f.name}" exceeds 10MB limit.`,
        })
      }
      if (!ALLOWED_MIME.includes(f.type ?? "") && !String(f.type ?? "").startsWith("image/")) {
        return NextResponse.json({
          success: false,
          error: `File "${f.name}" must be PDF or image (JPEG, PNG, WebP).`,
        })
      }
    }

    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
    const admin = getSupabaseAdminClient()
    const { data: buckets, error: listErr } = await admin.storage.listBuckets()
    if (listErr) throw new Error(listErr.message)
    if (!buckets?.some((b) => b.name === PROVIDER_DOCUMENTS_BUCKET)) {
      const { error: createErr } = await admin.storage.createBucket(
        PROVIDER_DOCUMENTS_BUCKET,
        { public: false, fileSizeLimit: String(MAX_FILE_SIZE_BYTES) }
      )
      if (createErr && !createErr.message.toLowerCase().includes("already")) {
        throw new Error(createErr.message)
      }
    }

    const uploads: { path: string; token: string }[] = []
    for (const file of files) {
      const ext = (file.name || "").split(".").pop()?.toLowerCase() || "bin"
      const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "bin"
      const storagePath = `${providerProfileId}/${randomUUID()}.${safeExt}`
      const { data: signed, error: signedErr } = await admin.storage
        .from(PROVIDER_DOCUMENTS_BUCKET)
        .createSignedUploadUrl(storagePath)
      if (signedErr || !signed?.token) {
        return NextResponse.json({
          success: false,
          error: `Failed to create upload URL: ${signedErr?.message || "Unknown error"}`,
        })
      }
      uploads.push({ path: storagePath, token: signed.token })
    }

    return NextResponse.json({ success: true, uploads })
  } catch (e) {
    const message = e instanceof Error ? e.message : "An unexpected error occurred."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
