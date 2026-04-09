import "server-only"
import fs from "node:fs"
import path from "node:path"
import type { Attachment } from "resend"
import { absoluteUrl } from "@/lib/email/brand"

/** Must match `contentId` on the inline attachment and `src="cid:…"` in HTML. */
export const TWOOKY_LOGO_CONTENT_ID = "twooky-logo"

let cachedLogo: Buffer | null | undefined

function readLogoBuffer(): Buffer | null {
  if (cachedLogo !== undefined) return cachedLogo
  try {
    const filePath = path.join(process.cwd(), "public", "images", "twooky-logo.png")
    cachedLogo = fs.readFileSync(filePath)
    return cachedLogo
  } catch {
    cachedLogo = null
    return null
  }
}

/** Inline PNG for Resend; avoids broken remote images when SITE_URL is wrong or clients block hotlinking. */
export function getTwookyLogoInlineAttachment(): Attachment | null {
  const buf = readLogoBuffer()
  if (!buf) return null
  return {
    filename: "twooky-logo.png",
    content: buf,
    contentType: "image/png",
    contentId: TWOOKY_LOGO_CONTENT_ID,
  }
}

/** Use with the attachment above; falls back to absolute public URL if the file is missing. */
export function getTwookyLogoEmailImgSrc(): string {
  if (readLogoBuffer()) {
    return `cid:${TWOOKY_LOGO_CONTENT_ID}`
  }
  return absoluteUrl("/images/twooky-logo.png")
}

export function twookyLogoEmailImgTag(): string {
  const src = getTwookyLogoEmailImgSrc()
  return `<img src="${src}" alt="Twooky" width="160" height="48" style="display:block;height:auto;max-width:160px;border:0;"/>`
}
