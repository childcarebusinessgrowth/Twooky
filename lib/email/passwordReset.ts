import "server-only"
import { absoluteUrl, BRAND_BACKGROUND, BRAND_MUTED, BRAND_PRIMARY, BRAND_SECONDARY, getSiteOrigin } from "@/lib/email/brand"
import { getResendClient, getResendFromAddress, logResendSendError } from "@/lib/email/resendClient"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildPasswordResetEmailParts(resetLink: string): { subject: string; html: string; text: string } {
  const subject = "Reset your Twooky password"
  const logoUrl = absoluteUrl("/images/twooky-logo.png")
  const safeLink = escapeHtml(resetLink)

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
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND_SECONDARY};">Password reset</p>
              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;color:${BRAND_PRIMARY};font-weight:700;">Reset your password</h1>
              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.55;color:#334155;">
                We received a request to reset the password for your Twooky account. Click the button below to choose a new password.
              </p>
              <p style="margin:0 0 24px 0;">
                <a href="${safeLink}" style="display:inline-block;padding:12px 24px;background:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Reset password</a>
              </p>
              <p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND_MUTED};">
                If you didn&apos;t ask for this, you can ignore this email. This link expires after a short time.
              </p>
              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.5;color:${BRAND_MUTED};word-break:break-all;">
                Or copy this link:<br/><span style="color:${BRAND_PRIMARY};">${safeLink}</span>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:0;padding:0 8px;font-size:12px;color:${BRAND_MUTED};text-align:center;">${escapeHtml(getSiteOrigin())}</p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    "Reset your Twooky password",
    "",
    "We received a request to reset your password. Open this link in your browser:",
    resetLink,
    "",
    "If you didn't request this, you can ignore this email.",
    "",
    getSiteOrigin(),
  ].join("\n")

  return { subject, html, text }
}

export type SendPasswordResetEmailResult = { ok: true } | { ok: false; reason: "missing_resend" | "send_failed" }

/**
 * Sends a password recovery link via Resend. Caller supplies the Supabase action_link from generateLink.
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<SendPasswordResetEmailResult> {
  const resend = getResendClient()
  if (!resend) {
    console.warn("[email] RESEND_API_KEY is not set; cannot send password reset email.")
    return { ok: false, reason: "missing_resend" }
  }

  const { subject, html, text } = buildPasswordResetEmailParts(resetLink)

  const sent = await resend.emails.send({
    from: getResendFromAddress(),
    to: [to.trim()],
    subject,
    html,
    text,
  })

  if (sent.error) {
    logResendSendError("password reset", sent.error)
    return { ok: false, reason: "send_failed" }
  }

  console.info("[email] Password reset email sent.", { to: to.trim() })
  return { ok: true }
}
