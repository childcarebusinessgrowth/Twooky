import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import type { Database } from "@/lib/supabaseDatabase"
export {
  buildGuestInquiryNotification,
  buildInquiryNotification,
  buildReviewNotification,
} from "@/lib/providerNotificationPayloads"

type ProviderNotificationInsert = Database["public"]["Tables"]["provider_notifications"]["Insert"]

export async function insertProviderNotification(notification: ProviderNotificationInsert): Promise<void> {
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("provider_notifications").insert(notification)
  if (error) {
    console.error("provider_notifications insert error:", error)
  }
}
