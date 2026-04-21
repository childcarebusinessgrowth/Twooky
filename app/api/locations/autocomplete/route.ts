import { NextResponse } from "next/server"
import { getGooglePlaceAutocompleteSuggestions } from "@/lib/google-place-autocomplete"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get("input") ?? ""

    const { suggestions, error } = await getGooglePlaceAutocompleteSuggestions(input)
    if (error && suggestions.length === 0) {
      return NextResponse.json(
        { suggestions: [], error },
        {
          status: error === "Autocomplete is not configured." ? 503 : 200,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      )
    }

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  } catch {
    return NextResponse.json(
      { suggestions: [], error: "Unable to load location suggestions." },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    )
  }
}
