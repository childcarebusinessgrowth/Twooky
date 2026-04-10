import { NextResponse } from "next/server"

function absoluteRedirectUrl(location: string | null, requestUrl: string): string | null {
  if (!location?.trim()) return null
  const loc = location.trim()
  if (loc.startsWith("http://") || loc.startsWith("https://")) return loc
  if (loc.startsWith("//")) return `https:${loc}`
  try {
    return new URL(loc, requestUrl).href
  } catch {
    return null
  }
}

/**
 * Proxies Google Place Photos: resolves the redirect to a public googleusercontent URL
 * so the Maps API key is never exposed to the browser.
 */
export async function GET(request: Request) {
  const requestUrl = request.url
  const { searchParams } = new URL(requestUrl)
  const photoRef = searchParams.get("photo_reference")?.trim()
  const maxwidthRaw = searchParams.get("maxwidth") ?? "800"
  const parsed = parseInt(maxwidthRaw, 10)
  const maxwidth = Number.isFinite(parsed) ? Math.min(1600, Math.max(1, parsed)) : 800

  if (!photoRef || photoRef.length > 2048) {
    return NextResponse.json({ error: "Invalid photo_reference" }, { status: 400 })
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: "Maps not configured" }, { status: 503 })
  }

  const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?${new URLSearchParams({
    maxwidth: String(maxwidth),
    photo_reference: photoRef,
    key: apiKey,
  })}`

  const res = await fetch(googleUrl, {
    method: "GET",
    redirect: "manual",
    cache: "force-cache",
    next: { revalidate: 86400 },
  }).catch(() => null)

  if (!res) {
    return NextResponse.json({ error: "Photo request failed" }, { status: 502 })
  }

  const redirectStatuses = new Set([301, 302, 303, 307, 308])
  if (redirectStatuses.has(res.status)) {
    const loc = absoluteRedirectUrl(res.headers.get("location"), requestUrl)
    if (loc) {
      return NextResponse.redirect(loc, 307)
    }
  }

  if (res.ok) {
    const ct = res.headers.get("content-type")
    if (ct?.startsWith("image/") && res.body) {
      return new NextResponse(res.body, {
        status: 200,
        headers: {
          "Content-Type": ct,
          "Cache-Control": "public, max-age=86400",
        },
      })
    }
    if (res.redirected && res.url) {
      return NextResponse.redirect(res.url, 307)
    }
  }

  return NextResponse.json({ error: "Photo unavailable" }, { status: 502 })
}
