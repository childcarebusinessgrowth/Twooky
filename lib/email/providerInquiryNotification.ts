import "server-only"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { absoluteUrl, BRAND_BACKGROUND, BRAND_MUTED, BRAND_PRIMARY, BRAND_SECONDARY, getSiteOrigin } from "@/lib/email/brand"
import { getResendClient, getResendFromAddress } from "@/lib/email/resendClient"

export type ProviderInquiryKind = "inquiry" | "guest"

export type NotifyProviderNewInquiryParams = {
  providerProfileId: string
  inquiryId: string
  kind: ProviderInquiryKind
  /** Parent or guest display label (e.g. "Jane" or "Jane Doe") */
  fromName?: string | null
  /** Raw source from DB/API (directory, compare, microsite, …) */
  source?: string | null
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatSourceLabel(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const s = raw.trim().toLowerCase()
  switch (s) {
    case "directory":
      return "Directory"
    case "compare":
      return "Compare tool"
    case "microsite":
      return "Provider website"
    default:
      return raw.trim()
  }
}

function buildInquiryEmailParts(params: {
  businessName: string
  fromLine: string
  sourceLine: string | null
  dashboardUrl: string
  kind: ProviderInquiryKind
}): { subject: string; html: string; text: string } {
  const { businessName, fromLine, sourceLine, dashboardUrl, kind } = params
  const headline = kind === "guest" ? "New guest inquiry" : "New inquiry"
  const subject = `New lead on Twooky — ${businessName}`

  const logoUrl = absoluteUrl("/images/twooky-logo.png")
  const safeBusiness = escapeHtml(businessName)
  const safeFrom = escapeHtml(fromLine)
  const metaBlock =
    sourceLine != null
      ? `<p style="margin:16px 0 0 0;font-size:15px;line-height:1.5;color:${BRAND_MUTED};">${escapeHtml(sourceLine)}</p>`
      : ""

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
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND_SECONDARY};">${headline}</p>
              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;color:${BRAND_PRIMARY};font-weight:700;">${safeBusiness}</h1>
              <p style="margin:0;font-size:16px;line-height:1.55;color:#334155;">
                <strong style="color:${BRAND_PRIMARY};">${safeFrom}</strong> sent you a message on Twooky.
              </p>
              ${metaBlock}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0 0;">
                <tr>
                  <td style="border-radius:8px;background:${BRAND_PRIMARY};">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">View in lead management</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0 0;font-size:13px;line-height:1.5;color:${BRAND_MUTED};">
                Open your Twooky dashboard to read and reply securely. This email does not include the message body.
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

  const textLines = [
    `${headline} — ${businessName}`,
    "",
    `${fromLine} sent you a message on Twooky.`,
    sourceLine ? `Source: ${sourceLine}` : null,
    "",
    `Open lead management: ${dashboardUrl}`,
    "",
    "This email does not include the message body. Sign in to Twooky to read and reply.",
    "",
    `— Twooky · ${getSiteOrigin()}`,
  ].filter((line): line is string => line != null)

  return { subject, html, text: textLines.join("\n") }
}

/**
 * Sends a branded notification to the provider when a new inquiry is created.
 * Never throws; logs errors. Respects notify_new_inquiries and skips if RESEND_API_KEY is unset.
 */
export async function notifyProviderNewInquiry(params: NotifyProviderNewInquiryParams): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY is not set; skipping provider inquiry notification.")
    return
  }

  const { providerProfileId, inquiryId, kind, fromName, source } = params

  try {
    const admin = getSupabaseAdminClient()

    const [{ data: profileRow, error: profileErr }, { data: ppRow, error: ppErr }] = await Promise.all([
      admin.from("profiles").select("email").eq("id", providerProfileId).maybeSingle(),
      admin
        .from("provider_profiles")
        .select("business_name, notify_new_inquiries")
        .eq("profile_id", providerProfileId)
        .maybeSingle(),
    ])

    if (profileErr || ppErr) {
      console.error("[email] Provider lookup failed:", profileErr ?? ppErr)
      return
    }

    if (!ppRow?.notify_new_inquiries) return

    const to = profileRow?.email?.trim()
    if (!to) {
      console.warn("[email] No provider email on file; skipping inquiry notification.")
      return
    }

    const businessName = ppRow.business_name?.trim() || "Your listing"
    const fromLine =
      fromName?.trim() ||
      (kind === "guest" ? "A guest" : "A parent")

    const sourceLabel = formatSourceLabel(source)
    const sourceLine = sourceLabel ? `Source: ${sourceLabel}` : null

    const dashboardUrl = `${getSiteOrigin().replace(/\/$/, "")}/dashboard/provider/inquiries?open=${encodeURIComponent(inquiryId)}`
    const { subject, html, text } = buildInquiryEmailParts({
      businessName,
      fromLine,
      sourceLine,
      dashboardUrl,
      kind,
    })

    const sent = await resend.emails.send({
      from: getResendFromAddress(),
      to: [to],
      subject,
      html,
      text,
    })

    if (sent.error) {
      console.error("[email] Resend send failed:", sent.error)
    }
  } catch (e) {
    console.error("[email] notifyProviderNewInquiry error:", e)
  }
}
