import { NextResponse } from "next/server"
import { geocodeAddressToCoordinates } from "@/lib/geocode-server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")

  if (!address?.trim()) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 })
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()

  if (!apiKey) {
    return NextResponse.json({ error: "Geocoding is not configured." }, { status: 503 })
  }

  const coords = await geocodeAddressToCoordinates(address, apiKey)

  if (!coords) {
    return NextResponse.json({ error: "Address could not be geocoded." }, { status: 404 })
  }

  return NextResponse.json(coords)
}
