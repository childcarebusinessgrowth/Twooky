import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { parseMarketId, type MarketId } from "@/lib/market"

const COOKIE_MARKET = "twooky_market"
const COOKIE_OVERRIDE = "twooky_market_override"
const ONE_YEAR = 60 * 60 * 24 * 365

function isValidMarket(value: unknown): value is MarketId {
  return value === "uk" || value === "us" || value === "uae" || value === "global"
}

export async function GET() {
  const jar = await cookies()
  const market: MarketId = parseMarketId(jar.get(COOKIE_MARKET)?.value) ?? "global"
  return NextResponse.json({ market })
}

export async function POST(request: Request) {
  let body: { market?: unknown } = {}
  try {
    body = (await request.json()) as { market?: unknown }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!isValidMarket(body.market)) {
    return NextResponse.json({ error: "Invalid market" }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true, market: body.market })
  res.cookies.set(COOKIE_MARKET, body.market, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  })
  res.cookies.set(COOKIE_OVERRIDE, "1", {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  })
  return res
}
