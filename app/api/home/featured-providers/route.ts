import { NextResponse } from "next/server"
import { selectFeaturedProviders } from "@/lib/featured-providers-selection"
import { marketToVisitorCountryCode, normalizeCountryCode } from "@/lib/market"
import { getMarketFromCookies } from "@/lib/market-server"
import {
  activeProviderRowToCardData,
  getActiveProvidersFromDbCached,
} from "@/lib/search-providers-db"
import type { VisitorGeo } from "@/lib/visitor-geo"

function parseFloatParam(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseCountryCode(value: string | null): string | null {
  return normalizeCountryCode(value)
}

export async function GET(request: Request) {
  try {
    const market = await getMarketFromCookies()
    const marketCountryCode = marketToVisitorCountryCode(market)
    const url = new URL(request.url)
    const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "3", 10)
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 6) : 3

    const parsedCountry = parseCountryCode(url.searchParams.get("country"))
    const effectiveCountry = marketCountryCode ?? parsedCountry
    const geo: VisitorGeo | null = {
      latitude: parseFloatParam(url.searchParams.get("lat")),
      longitude: parseFloatParam(url.searchParams.get("lng")),
      city: url.searchParams.get("city")?.trim() || null,
      countryCode: effectiveCountry,
    }

    const activeRows = await getActiveProvidersFromDbCached()
    const selectedRows = selectFeaturedProviders(activeRows, {
      visitorGeo:
        geo.city || geo.countryCode || geo.latitude !== null || geo.longitude !== null ? geo : null,
      enforceVisitorCountry: Boolean(marketCountryCode),
      limit,
    })

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
    const providers = selectedRows.map((row) => activeProviderRowToCardData(row, baseUrl))

    return NextResponse.json(
      { providers },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (error) {
    console.error("[home-featured-api] Failed to resolve personalized featured providers", error)
    return NextResponse.json(
      { providers: [] },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    )
  }
}
