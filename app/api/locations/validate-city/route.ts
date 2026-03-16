import { NextResponse } from "next/server"

import { getCountryById } from "@/lib/location-directory"
import { validateCityInCountry } from "@/lib/geocode-server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { countryId?: string; cityName?: string }
    const countryId = typeof body.countryId === "string" ? body.countryId.trim() : ""
    const cityName = typeof body.cityName === "string" ? body.cityName.trim() : ""

    if (!countryId) {
      return NextResponse.json({ valid: false, error: "Please select a country first." }, { status: 400 })
    }

    if (!cityName) {
      return NextResponse.json({ valid: false, error: "Please enter a city name." }, { status: 400 })
    }

    const country = await getCountryById(countryId)
    if (!country) {
      return NextResponse.json({ valid: false, error: "Invalid country." }, { status: 400 })
    }

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()

    const result = await validateCityInCountry(cityName, country.name, apiKey)

    if (result.valid) {
      return NextResponse.json({ valid: true, canonicalName: result.canonicalName })
    }

    return NextResponse.json({ valid: false, error: result.error }, { status: 400 })
  } catch {
    return NextResponse.json(
      { valid: false, error: "Could not verify city. Please try again." },
      { status: 500 },
    )
  }
}
