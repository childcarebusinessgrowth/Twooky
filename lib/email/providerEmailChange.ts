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

function buildProviderEmailChangeEmailParts(params: {
  currentEmail: string
  requestedEmail: string
  confirmationLink: string
}): { subject: string; html: string; text: string; attachments: Attachment[] } {
  const { currentEmail, requestedEmail, confirmationLink } = params
  const subject = "Confirm your Twooky email change"
  const logoImg = twookyLogoEmailImgTag()
  const safeCurrentEmail = escapeHtml(currentEmail)
  const safeRequestedEmail = escapeHtml(requestedEmail)
  const safeLink = escapeHtml(confirmationLink)

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
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND_SECONDARY};">Email change request</p>
              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;color:${BRAND_PRIMARY};font-weight:700;">Confirm your new login email</h1>
              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.55;color:#334155;">
                We received a request to change the email on your provider account from <strong>${safeCurrentEmail}</strong> to <strong>${safeRequestedEmail}</strong>.
                Confirm this request to keep your provider profile, plans, and details unchanged while updating your login email.
              </p>
              <p style="margin:0 0 24px 0;">
                <a href="${safeLink}" style="display:inline-block;padding:12px 24px;background:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Confirm email change</a>
              </p>
              <p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND_MUTED};">
                After confirmation, you&apos;ll be signed out and can log back in with your new email address.
              </p>
              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.5;color:${BRAND_MUTED};word-break:break-all;">
                Or copy this link:<br/><span style="color:${BRAND_PRIMARY};">${safeLink}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND_MUTED};">
                If you didn&apos;t request this change, you can safely ignore this email.
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
    "Confirm your Twooky email change",
    "",
    `We received a request to change your provider account email from ${currentEmail} to ${requestedEmail}.`,
    "Confirm the change here:",
    confirmationLink,
    "",
    "After confirmation, you'll be signed out and can log back in with your new email address.",
    "",
    `If you didn't request this change, you can ignore this email.`,
    "",
    `— Twooky · ${getSiteOrigin()}`,
  ].join("\n")

  const attachments: Attachment[] = []
  const logoAtt = getTwookyLogoInlineAttachment()
  if (logoAtt) attachments.push(logoAtt)

  return { subject, html, text, attachments }
}

export async function sendProviderEmailChangeConfirmationEmail(params: {
  to: string
  currentEmail: string
  requestedEmail: string
  confirmationLink: string
}): Promise<boolean> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY is not set; cannot send provider email change confirmation email.")
    return false
  }

  const { subject, html, text, attachments } = buildProviderEmailChangeEmailParts(params)
  const sent = await resend.emails.send({
    from: getResendFromAddress(),
    to: [params.to.trim()],
    subject,
    html,
    text,
    ...(attachments.length > 0 ? { attachments } : {}),
  })

  if (sent.error) {
    logResendSendError("provider email change confirmation", sent.error)
    return false
  }

  console.info("[email] Provider email change confirmation sent.", { to: params.to.trim() })
  return true
}
