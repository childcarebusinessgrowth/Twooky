import "server-only"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import {
  BRAND_BACKGROUND,
  BRAND_MUTED,
  BRAND_PRIMARY,
  BRAND_SECONDARY,
  EMAIL_HEADER_BACKGROUND,
  getSiteOrigin,
} from "@/lib/email/brand"
import { getResendClient, getResendFromAddress, logResendSendError } from "@/lib/email/resendClient"
import { getTwookyLogoInlineAttachment, twookyLogoEmailImgTag } from "@/lib/email/twookyLogoInline"

export type FavoriteAvailabilityKind = "full" | "waitlist"

export type NotifyFavoritingParentsParams = {
  providerProfileId: string
  kind: FavoriteAvailabilityKind
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildEmailParts(params: {
  businessName: string
  kind: FavoriteAvailabilityKind
  savedUrl: string
  listingUrl: string | null
}): { subject: string; html: string; text: string } {
  const { businessName, kind, savedUrl, listingUrl } = params
  const safeBusiness = escapeHtml(businessName)
  const logoImg = twookyLogoEmailImgTag()

  const isFull = kind === "full"
  const headline = isFull ? "No availability" : "Waitlist"
  const subject = isFull
    ? `Twooky: ${businessName} is now full`
    : `Twooky: ${businessName} is now on a waitlist`

  const bodyCopy = isFull
    ? `This provider is marked as <strong style="color:${BRAND_PRIMARY};">full</strong> — they are not taking new placements in this period. You saved them to your list, so we wanted you to know.`
    : `This provider is now on a <strong style="color:${BRAND_PRIMARY};">waitlist</strong>. You saved them to your list, so we wanted you to know.`

  const listingBlock =
    listingUrl != null
      ? `<p style="margin:16px 0 0 0;font-size:14px;line-height:1.5;color:${BRAND_MUTED};">
           <a href="${listingUrl}" style="color:${BRAND_PRIMARY};font-weight:600;">View their Twoky listing</a>
         </p>`
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
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND_SECONDARY};">${headline}</p>
              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;color:${BRAND_PRIMARY};font-weight:700;">${safeBusiness}</h1>
              <p style="margin:0;font-size:16px;line-height:1.55;color:#334155;">${bodyCopy}</p>
              ${listingBlock}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0 0;">
                <tr>
                  <td style="border-radius:8px;background:${BRAND_PRIMARY};">
                    <a href="${savedUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">View saved providers</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0 0;font-size:13px;line-height:1.5;color:${BRAND_MUTED};">
                You received this because you saved this provider on Twooky.
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
    subject.replace(/^Twooky: /, ""),
    "",
    isFull
      ? `${businessName} is now full — not taking new placements in this period.`
      : `${businessName} is now on a waitlist.`,
    "",
    `Saved providers: ${savedUrl}`,
    listingUrl ? `Listing: ${listingUrl}` : null,
    "",
    "You received this because you saved this provider on Twooky.",
    "",
    `— Twooky · ${getSiteOrigin()}`,
  ].filter((line): line is string => line != null)

  return { subject, html, text: textLines.join("\n") }
}

/**
 * Emails all parents who favorited this provider when availability becomes full or waitlist.
 * Never throws; logs per-recipient Resend errors. Skips if RESEND_API_KEY unset or no favorites.
 */
export async function notifyFavoritingParentsOfAvailabilityChange(
  params: NotifyFavoritingParentsParams
): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY is not set; skipping favorite availability notification.")
    return
  }

  const { providerProfileId, kind } = params

  try {
    const admin = getSupabaseAdminClient()

    const [{ data: favRows, error: favErr }, { data: ppRow, error: ppErr }] = await Promise.all([
      admin.from("parent_favorites").select("parent_profile_id").eq("provider_profile_id", providerProfileId),
      admin
        .from("provider_profiles")
        .select("business_name, provider_slug")
        .eq("profile_id", providerProfileId)
        .maybeSingle(),
    ])

    if (favErr || ppErr) {
      console.error("[email] Favorite availability lookup failed:", favErr ?? ppErr)
      return
    }

    const parentIds = [...new Set((favRows ?? []).map((r) => r.parent_profile_id))]
    if (parentIds.length === 0) return

    const { data: profileRows, error: profilesErr } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", parentIds)

    if (profilesErr) {
      console.error("[email] profiles lookup for favorites failed:", profilesErr)
      return
    }

    const businessName = ppRow?.business_name?.trim() || "A provider"
    const slug = ppRow?.provider_slug?.trim() || null
    const origin = getSiteOrigin().replace(/\/$/, "")
    const savedUrl = `${origin}/dashboard/parent/saved`
    const listingUrl = slug ? `${origin}/providers/${encodeURIComponent(slug)}` : null

    const { subject, html, text } = buildEmailParts({
      businessName,
      kind,
      savedUrl,
      listingUrl,
    })

    const from = getResendFromAddress()
    const logoAtt = getTwookyLogoInlineAttachment()

    for (const row of profileRows ?? []) {
      const to = row.email?.trim()
      if (!to) continue

      const sent = await resend.emails.send({
        from,
        to: [to],
        subject,
        html,
        text,
        ...(logoAtt ? { attachments: [logoAtt] } : {}),
      })

      if (sent.error) {
        logResendSendError(`favorite availability (${to})`, sent.error)
      }
    }
  } catch (e) {
    console.error("[email] notifyFavoritingParentsOfAvailabilityChange error:", e)
  }
}
