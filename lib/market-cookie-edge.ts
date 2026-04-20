import type { NextRequest, NextResponse } from "next/server"
import { ipCountryToMarket, type MarketId } from "@/lib/market"

const COOKIE_MARKET = "twooky_market"
const COOKIE_OVERRIDE = "twooky_market_override"
const ONE_YEAR = 60 * 60 * 24 * 365

function isValidMarket(value: string | undefined): value is MarketId {
  return value === "uk" || value === "us" || value === "uae" || value === "global"
}

/**
 * Sets `twooky_market` from CDN IP country when the visitor has no manual override.
 * Call on HTML navigations (not typically on `/api/*`).
 */
export function applyMarketCookieFromIp(request: NextRequest, response: NextResponse): void {
  const hasOverride = request.cookies.get(COOKIE_OVERRIDE)?.value === "1"
  const existing = request.cookies.get(COOKIE_MARKET)?.value

  // User explicitly picked a market; keep their preference.
  if (hasOverride && isValidMarket(existing)) {
    return
  }

  const ipCountry =
    request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry")

  const inferred = ipCountryToMarket(ipCountry)
  const market: MarketId = inferred ?? "global"
  if (existing === market) return

  response.cookies.set(COOKIE_MARKET, market, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  })
}
