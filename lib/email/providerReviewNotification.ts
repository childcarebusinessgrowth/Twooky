import "server-only"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import {
  absoluteUrl,
  BRAND_BACKGROUND,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  EMAIL_HEADER_BACKGROUND,
  getSiteOrigin,
} from "@/lib/email/brand"
import { getResendClient, getResendFromAddress, logResendSendError } from "@/lib/email/resendClient"
import { getTwookyLogoInlineAttachment, twookyLogoEmailImgTag } from "@/lib/email/twookyLogoInline"

export type NotifyProviderNewReviewParams = {
  providerProfileId: string
  reviewId: string
  rating: number
  reviewText: string
  fromName?: string | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildReviewSnippet(reviewText: string): string | null {
  const snippet = reviewText.trim().replace(/\s+/g, " ").slice(0, 180)
  return snippet.length > 0 ? snippet : null
}

function buildReviewEmailParts(params: {
  businessName: string
  fromLine: string
  rating: number
  reviewSnippet: string | null
  dashboardUrl: string
}): { subject: string; html: string; text: string } {
  const { businessName, fromLine, rating, reviewSnippet, dashboardUrl } = params
  const subject = `New ${rating}-star review on Twooky — ${businessName}`
  const safeBusinessName = escapeHtml(businessName)
  const safeFromLine = escapeHtml(fromLine)
  const safeSnippet = reviewSnippet ? escapeHtml(reviewSnippet) : null
  const logoImg = twookyLogoEmailImgTag()
  const reviewLine = safeSnippet
    ? `<p style="margin:18px 0 0 0;padding:16px 18px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;font-size:15px;line-height:1.6;color:#334155;">"${safeSnippet}${reviewSnippet!.length >= 180 ? "..." : ""}"</p>`
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
            <td bgcolor="#ffffff" style="padding:28px 28px 12px 28px;background-color:${EMAIL_HEADER_BACKGROUND};border-bottom:1px solid #e2e8f0;">
              ${logoImg}
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND_SECONDARY};">New review</p>
              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;color:${BRAND_PRIMARY};font-weight:700;">${safeBusinessName}</h1>
              <p style="margin:0;font-size:16px;line-height:1.55;color:#334155;">
                <strong style="color:${BRAND_PRIMARY};">${safeFromLine}</strong> left a <strong>${rating}-star</strong> review on Twooky.
              </p>
              ${reviewLine}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0 0;">
                <tr>
                  <td style="border-radius:8px;background:${BRAND_PRIMARY};">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">View reviews</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0 0;font-size:13px;line-height:1.5;color:${BRAND_MUTED};">
                Open your Twooky dashboard to read the full review and reply if needed.
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
    `New ${rating}-star review — ${businessName}`,
    "",
    `${fromLine} left a new review on Twooky.`,
    reviewSnippet ? `Review preview: "${reviewSnippet}${reviewSnippet.length >= 180 ? "..." : ""}"` : null,
    "",
    `Open reviews: ${dashboardUrl}`,
    "",
    `— Twooky · ${getSiteOrigin()}`,
  ]
    .filter((line): line is string => line != null)
    .join("\n")

  return { subject, html, text }
}

type ProviderReviewEmailRow = {
  business_name: string | null
  notify_new_reviews: boolean
  owner_profile_id: string | null
}

async function loadProviderProfileForReviewEmail(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  providerProfileId: string
): Promise<{ data: ProviderReviewEmailRow | null; error: { message: string } | null }> {
  const fullRaw = await admin
    .from("provider_profiles" as never)
    .select("business_name, notify_new_reviews, owner_profile_id")
    .eq("profile_id", providerProfileId)
    .maybeSingle()
  const full = fullRaw as unknown as { data: Record<string, unknown> | null; error: { message: string } | null }

  if (!full.error) {
    const row = full.data
    if (!row) return { data: null, error: null }
    return {
      data: {
        business_name: typeof row.business_name === "string" ? row.business_name : null,
        notify_new_reviews: typeof row.notify_new_reviews === "boolean" ? row.notify_new_reviews : true,
        owner_profile_id: typeof row.owner_profile_id === "string" ? row.owner_profile_id : null,
      },
      error: null,
    }
  }

  const msg = full.error.message ?? ""
  if (msg.includes("notify_new_reviews") || msg.includes("does not exist")) {
    console.warn(
      "[email] provider_profiles.notify_new_reviews missing; using business_name only and defaulting notifications to on. Apply supabase/migrations/*provider_notification_prefs*.sql on your database.",
    )
    const minimalRaw = await admin
      .from("provider_profiles" as never)
      .select("business_name, owner_profile_id")
      .eq("profile_id", providerProfileId)
      .maybeSingle()
    const minimal = minimalRaw as unknown as {
      data: Record<string, unknown> | null
      error: { message: string } | null
    }
    if (minimal.error) return { data: null, error: minimal.error }
    if (!minimal.data) return { data: null, error: null }
    return {
      data: {
        business_name: typeof minimal.data.business_name === "string" ? minimal.data.business_name : null,
        notify_new_reviews: true,
        owner_profile_id: typeof minimal.data.owner_profile_id === "string" ? minimal.data.owner_profile_id : null,
      },
      error: null,
    }
  }

  return { data: null, error: full.error }
}

export async function notifyProviderNewReview(params: NotifyProviderNewReviewParams): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY is not set; skipping provider review notification.")
    return
  }

  const { providerProfileId, reviewId, rating, reviewText, fromName } = params

  try {
    const admin = getSupabaseAdminClient()
    const providerRes = await loadProviderProfileForReviewEmail(admin, providerProfileId)
    const providerRow = providerRes.data

    if (providerRes.error) {
      console.error("[email] Provider lookup failed for review email:", providerRes.error)
      return
    }

    if (!providerRow) {
      console.warn("[email] No provider_profiles row; skipping review notification.", { providerProfileId, reviewId })
      return
    }

    if (!providerRow.notify_new_reviews) {
      console.warn(
        "[email] Provider has new-review emails turned off in settings; skipping review notification.",
        { providerProfileId, reviewId }
      )
      return
    }

    const recipientProfileId = providerRow.owner_profile_id ?? providerProfileId
    const { data: profileRow, error: profileError } = await admin
      .from("profiles")
      .select("email")
      .eq("id", recipientProfileId)
      .maybeSingle()

    if (profileError) {
      console.error("[email] Provider email profile lookup failed:", profileError)
      return
    }

    let to = profileRow?.email?.trim() ?? ""
    if (!to) {
      const { data: authUserData, error: authUserError } = await admin.auth.admin.getUserById(recipientProfileId)
      if (authUserError) {
        console.error("[email] Could not load auth user for provider review email fallback:", authUserError)
      }
      to = authUserData?.user?.email?.trim() ?? ""
    }

    if (!to) {
      console.warn("[email] No provider email found; skipping review notification.", {
        providerProfileId,
        recipientProfileId,
        reviewId,
      })
      return
    }

    const businessName = providerRow.business_name?.trim() || "Your listing"
    const reviewSnippet = buildReviewSnippet(reviewText)
    const dashboardUrl = absoluteUrl("/dashboard/provider/reviews")
    const { subject, html, text } = buildReviewEmailParts({
      businessName,
      fromLine: fromName?.trim() || "A parent",
      rating,
      reviewSnippet,
      dashboardUrl,
    })

    const logoAttachment = getTwookyLogoInlineAttachment()
    const sent = await resend.emails.send({
      from: getResendFromAddress(),
      to: [to],
      subject,
      html,
      text,
      ...(logoAttachment ? { attachments: [logoAttachment] } : {}),
    })

    if (sent.error) {
      logResendSendError("provider review", sent.error)
      return
    }

    console.info("[email] Provider review notification sent.", { to, reviewId, providerProfileId })
  } catch (error) {
    console.error("[email] notifyProviderNewReview error:", error)
  }
}
