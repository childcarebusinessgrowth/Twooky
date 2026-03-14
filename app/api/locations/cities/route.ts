import { NextResponse } from "next/server"

import { getCitiesForSignupByCountry } from "@/lib/location-directory"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get("countryId") ?? ""

    if (!countryId) {
      return NextResponse.json({ cities: [] }, { status: 200 })
    }

    const cities = await getCitiesForSignupByCountry(countryId)
    return NextResponse.json({ cities })
  } catch {
    return NextResponse.json(
      { error: "Unable to load cities right now.", cities: [] },
      { status: 503 },
    )
  }
}

