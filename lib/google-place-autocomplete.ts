"use server"

import { fetchWithTimeout } from "@/lib/fetch-with-timeout"

export type GooglePlaceAutocompleteSuggestion = {
  placeId: string
  description: string
  mainText: string
  secondaryText?: string
}

type GooglePlaceAutocompletePrediction = {
  place_id?: string
  description?: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

type GooglePlaceAutocompleteResponse = {
  status?: string
  error_message?: string
  predictions?: GooglePlaceAutocompletePrediction[]
}

function getGoogleMapsApiKey(): string | null {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
  return apiKey || null
}

export async function getGooglePlaceAutocompleteSuggestions(
  input: string,
): Promise<{ suggestions: GooglePlaceAutocompleteSuggestion[]; error?: string }> {
  const apiKey = getGoogleMapsApiKey()
  const trimmedInput = input.trim()

  if (!apiKey) {
    return { suggestions: [], error: "Autocomplete is not configured." }
  }

  if (trimmedInput.length < 2) {
    return { suggestions: [] }
  }

  const query = new URLSearchParams({
    input: trimmedInput,
    key: apiKey,
    types: "geocode",
  })

  const response = await fetchWithTimeout(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${query.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
    10_000,
  ).catch(() => null)

  if (!response?.ok) {
    return { suggestions: [], error: "Autocomplete request failed." }
  }

  const payload = (await response.json()) as GooglePlaceAutocompleteResponse
  if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
    return { suggestions: [], error: payload.error_message || "Autocomplete is unavailable." }
  }

  const suggestions = (payload.predictions ?? [])
    .map((prediction) => {
      const placeId = prediction.place_id?.trim()
      const description = prediction.description?.trim()
      const mainText = prediction.structured_formatting?.main_text?.trim()
      if (!placeId || !description || !mainText) return null

      return {
        placeId,
        description,
        mainText,
        secondaryText: prediction.structured_formatting?.secondary_text?.trim() || undefined,
      }
    })
    .filter((suggestion): suggestion is GooglePlaceAutocompleteSuggestion => suggestion !== null)
    .slice(0, 8)

  return { suggestions }
}
