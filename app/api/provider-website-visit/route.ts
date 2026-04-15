import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { parseConsentCookie } from "@/lib/cookie-consent"
import { enforceRateLimit, enforceTrustedOrigin } from "@/lib/request-guards"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

const VISITOR_COOKIE_NAME = "eld_microsite_visitor"
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

type MicrositeVisitPayload = {
  subdomain?: string
  pageSlug?: string
}

function normalizeSubdomain(raw: unknown): string {
  if (typeof raw !== "string") return ""
  return raw.trim().toLowerCase().replace(/^\/+|\/+$/g, "")
}

function normalizePageSlug(raw: unknown): string {
  if (typeof raw !== "string") return ""
  return raw.trim().toLowerCase().replace(/^\/+|\/+$/g, "")
}

function isLikelyVisitorToken(value: string | undefined): value is string {
  if (!value) return false
  return /^[A-Za-z0-9_-]{8,128}$/.test(value)
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request, { allowRootSubdomains: true })
  if (originError) return originError

  const rateLimitError = enforceRateLimit(request, {
    key: "provider-website-visit",
    limit: 30,
    windowMs: 60_000,
  })
  if (rateLimitError) return rateLimitError

  try {
    const consent = parseConsentCookie(request.headers.get("cookie"))
    if (consent?.analytics !== true) {
      return new NextResponse(null, { status: 204 })
    }

    const body = (await request.json()) as MicrositeVisitPayload
    const subdomain = normalizeSubdomain(body.subdomain)
    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required." }, { status: 400 })
    }

    const pageSlug = normalizePageSlug(body.pageSlug)
    const cookieStore = await cookies()
    const existingToken = cookieStore.get(VISITOR_COOKIE_NAME)?.value
    const visitorToken =
      isLikelyVisitorToken(existingToken) ? existingToken : crypto.randomUUID().replace(/-/g, "")

    if (!isLikelyVisitorToken(existingToken)) {
      cookieStore.set(VISITOR_COOKIE_NAME, visitorToken, {
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    const supabase = getSupabaseAdminClient()
    const { data: website, error: websiteError } = await supabase
      .from("provider_websites")
      .select("id, published_version_id")
      .ilike("subdomain_slug", subdomain)
      .maybeSingle()

    if (websiteError) {
      console.error("provider_websites lookup error:", websiteError)
      return NextResponse.json({ error: "Failed to record visit." }, { status: 500 })
    }

    if (!website?.id || !website.published_version_id) {
      return new NextResponse(null, { status: 204 })
    }

    const referrer = request.headers.get("referer")
    const userAgent = request.headers.get("user-agent")
    const { error: insertError } = await supabase.from("provider_website_visits").insert({
      provider_website_id: website.id,
      page_slug: pageSlug,
      visitor_token: visitorToken,
      referrer: referrer ? referrer.slice(0, 1024) : null,
      user_agent: userAgent ? userAgent.slice(0, 1024) : null,
    })

    if (insertError) {
      console.error("provider_website_visits insert error:", insertError)
      return NextResponse.json({ error: "Failed to record visit." }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Provider website visit API error:", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
