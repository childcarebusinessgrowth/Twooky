import "server-only"
import type { Attachment } from "resend"
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildClaimApprovedEmailParts(params: {
  claimantName: string
  businessName: string
  setPasswordLink: string
}): { subject: string; html: string; text: string; attachments: Attachment[] } {
  const { claimantName, businessName, setPasswordLink } = params
  const subject = "Your Twooky claim has been approved"
  const logoImg = twookyLogoEmailImgTag()
  const safeName = escapeHtml(claimantName)
  const safeBusiness = escapeHtml(businessName)
  const safeLink = escapeHtml(setPasswordLink)

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
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND_SECONDARY};">Claim approved</p>
              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;color:${BRAND_PRIMARY};font-weight:700;">Your listing is ready to manage</h1>
              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.55;color:#334155;">
                Hi ${safeName}, your claim request for <strong>${safeBusiness}</strong> has been approved.
                Set your password to activate access to your provider dashboard.
              </p>
              <p style="margin:0 0 24px 0;">
                <a href="${safeLink}" style="display:inline-block;padding:12px 24px;background:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Set password and access profile</a>
              </p>
              <p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND_MUTED};">
                After signing in, you can manage your profile details, respond to parent inquiries, and maintain your listing.
              </p>
              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.5;color:${BRAND_MUTED};word-break:break-all;">
                Or copy this link:<br/><span style="color:${BRAND_PRIMARY};">${safeLink}</span>
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
    "Your claim has been approved",
    "",
    `Hi ${claimantName},`,
    `Your claim request for ${businessName} has been approved.`,
    "Set your password and access your provider profile here:",
    setPasswordLink,
    "",
    "After signing in, you can manage your profile and respond to parent inquiries.",
    "",
    `— Twooky · ${getSiteOrigin()}`,
  ].join("\n")

  const attachments: Attachment[] = []
  const logoAtt = getTwookyLogoInlineAttachment()
  if (logoAtt) attachments.push(logoAtt)
  return { subject, html, text, attachments }
}

export async function sendClaimApprovedOnboardingEmail(params: {
  to: string
  claimantName: string
  businessName: string
  setPasswordLink: string
}): Promise<boolean> {
  const resend = getResendClient()
  if (!resend) return false

  const { to, claimantName, businessName, setPasswordLink } = params
  const { subject, html, text, attachments } = buildClaimApprovedEmailParts({
    claimantName,
    businessName,
    setPasswordLink,
  })

  const sent = await resend.emails.send({
    from: getResendFromAddress(),
    to: [to.trim()],
    subject,
    html,
    text,
    ...(attachments.length > 0 ? { attachments } : {}),
  })
  if (sent.error) {
    logResendSendError("claim approved onboarding", sent.error)
    return false
  }
  return true
}
