import { NextResponse } from "next/server"

import { getCountriesForSignup } from "@/lib/location-directory"

export async function GET() {
  try {
    const countries = await getCountriesForSignup()
    return NextResponse.json({ countries })
  } catch {
    return NextResponse.json(
      { error: "Unable to load countries right now.", countries: [] },
      { status: 503 },
    )
  }
}

