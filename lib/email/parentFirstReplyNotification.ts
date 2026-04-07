import "server-only"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { absoluteUrl, BRAND_BACKGROUND, BRAND_MUTED, BRAND_PRIMARY, BRAND_SECONDARY, getSiteOrigin } from "@/lib/email/brand"
import { getResendClient, getResendFromAddress } from "@/lib/email/resendClient"

export type NotifyParentFirstProviderReplyParams = {
  inquiryId: string
  /** Authenticated user's profile id — must match inquiry.provider_profile_id */
  providerProfileId: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildParentReplyEmailParts(params: {
  businessName: string
  dashboardUrl: string
}): { subject: string; html: string; text: string } {
  const { businessName, dashboardUrl } = params
  const subject = `Twooky: ${businessName} replied to your inquiry`
  const logoUrl = absoluteUrl("/images/twooky-logo.png")
  const safeBusiness = escapeHtml(businessName)

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${BRAND_BACKGROUND};font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND_BACKGROUND};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:28px 28px 12px 28px;background:linear-gradient(135deg,${BRAND_PRIMARY} 0%,#152a4a 100%);">
              <img src="${logoUrl}" alt="Twooky" width="160" height="48" style="display:block;height:auto;max-width:160px;border:0;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND_SECONDARY};">New reply</p>
              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;color:${BRAND_PRIMARY};font-weight:700;">${safeBusiness}</h1>
              <p style="margin:0;font-size:16px;line-height:1.55;color:#334155;">
                You have a new message in this conversation. Sign in to Twooky to read the full reply.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0 0;">
                <tr>
                  <td style="border-radius:8px;background:${BRAND_PRIMARY};">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">View messages</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0 0;font-size:13px;line-height:1.5;color:${BRAND_MUTED};">
                Open your Twooky inbox to read the full message. This email does not include the message body.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND_MUTED};">
                Sent by Twooky · ${escapeHtml(getSiteOrigin())}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    `${businessName} replied to your inquiry.`,
    "",
    `Open messages: ${dashboardUrl}`,
    "",
    "This email does not include the message body. Sign in to Twooky to read and reply.",
    "",
    `— Twooky · ${getSiteOrigin()}`,
  ].join("\n")

  return { subject, html, text }
}

/**
 * Notifies the parent when the provider sends their first reply in an inquiry thread.
 * Verifies sender is the provider and that exactly one provider row exists in inquiry_messages.
 * Never throws; logs errors. Skips if RESEND_API_KEY is unset or parent has no email.
 */
export async function notifyParentOfFirstProviderReply(
  params: NotifyParentFirstProviderReplyParams
): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY is not set; skipping parent first-reply notification.")
    return
  }

  const { inquiryId, providerProfileId } = params

  try {
    const admin = getSupabaseAdminClient()

    const { data: inquiryRow, error: inquiryErr } = await admin
      .from("inquiries")
      .select("parent_profile_id, provider_profile_id")
      .eq("id", inquiryId)
      .is("deleted_at", null)
      .maybeSingle()

    if (inquiryErr) {
      console.error("[email] Inquiry lookup failed:", inquiryErr)
      return
    }
    if (!inquiryRow || inquiryRow.provider_profile_id !== providerProfileId) {
      return
    }

    const { count: providerMsgCount, error: countErr } = await admin
      .from("inquiry_messages")
      .select("id", { count: "exact", head: true })
      .eq("inquiry_id", inquiryId)
      .eq("sender_type", "provider")

    if (countErr) {
      console.error("[email] inquiry_messages count failed:", countErr)
      return
    }
    if (providerMsgCount !== 1) {
      return
    }

    const parentProfileId = inquiryRow.parent_profile_id

    const [{ data: parentProfile, error: parentErr }, { data: ppRow, error: ppErr }] = await Promise.all([
      admin.from("profiles").select("email").eq("id", parentProfileId).maybeSingle(),
      admin.from("provider_profiles").select("business_name").eq("profile_id", providerProfileId).maybeSingle(),
    ])

    if (parentErr || ppErr) {
      console.error("[email] Parent/provider profile lookup failed:", parentErr ?? ppErr)
      return
    }

    const to = parentProfile?.email?.trim()
    if (!to) {
      console.warn("[email] No parent email on file; skipping first-reply notification.")
      return
    }

    const businessName = ppRow?.business_name?.trim() || "A provider"
    const dashboardUrl = `${getSiteOrigin().replace(/\/$/, "")}/dashboard/parent/inquiries?open=${encodeURIComponent(inquiryId)}`
    const { subject, html, text } = buildParentReplyEmailParts({ businessName, dashboardUrl })

    const sent = await resend.emails.send({
      from: getResendFromAddress(),
      to: [to],
      subject,
      html,
      text,
    })

    if (sent.error) {
      console.error("[email] Resend send failed (parent first reply):", sent.error)
    }
  } catch (e) {
    console.error("[email] notifyParentOfFirstProviderReply error:", e)
  }
}
