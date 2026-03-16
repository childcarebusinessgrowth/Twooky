"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

const CONTACT_MESSAGES_PATH = "/admin/contact-messages"

export type ContactMessageStatus = "new" | "in_progress" | "contacted" | "resolved"

export type UpdateStatusResult = { ok: true } | { ok: false; error: string }

const ALLOWED_STATUSES: ContactMessageStatus[] = ["new", "in_progress", "contacted", "resolved"]

export async function updateContactMessageStatus(
  id: string,
  status: string
): Promise<UpdateStatusResult> {
  try {
    await assertServerRole("admin")
  } catch {
    return { ok: false, error: "Unauthorized" }
  }

  if (!ALLOWED_STATUSES.includes(status as ContactMessageStatus)) {
    return { ok: false, error: "Invalid status" }
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin
    .from("contact_messages")
    .update({ handled_status: status })
    .eq("id", id)

  if (error) {
    return { ok: false, error: error.message }
  }
  revalidatePath(CONTACT_MESSAGES_PATH)
  return { ok: true }
}

export type DeleteContactMessageResult = { ok: true } | { ok: false; error: string }

export async function deleteContactMessage(id: string): Promise<DeleteContactMessageResult> {
  try {
    await assertServerRole("admin")
  } catch {
    return { ok: false, error: "Unauthorized" }
  }

  const admin = getSupabaseAdminClient()
  const { error } = await admin.from("contact_messages").delete().eq("id", id)

  if (error) {
    return { ok: false, error: error.message }
  }
  revalidatePath(CONTACT_MESSAGES_PATH)
  return { ok: true }
}
