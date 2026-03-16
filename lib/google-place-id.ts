import "server-only"

type GoogleFindPlaceResponse = {
  status?: string
  error_message?: string
  candidates?: Array<{
    place_id?: string
  }>
}

function getGoogleMapsApiKey(): string | null {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()
  return apiKey || null
}

export async function resolveGooglePlaceIdFromText(
  businessName: string,
  address: string
): Promise<string | null> {
  const apiKey = getGoogleMapsApiKey()
  const trimmedBusinessName = businessName.trim()
  const trimmedAddress = address.trim()

  if (!apiKey || !trimmedBusinessName || !trimmedAddress) {
    return null
  }

  const query = new URLSearchParams({
    input: `${trimmedBusinessName}, ${trimmedAddress}`,
    inputtype: "textquery",
    fields: "place_id",
    key: apiKey,
  })

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${query.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  ).catch(() => null)

  if (!response || !response.ok) return null

  const payload = (await response.json()) as GoogleFindPlaceResponse
  if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") return null

  const candidate = payload.candidates?.[0]
  const placeId = candidate?.place_id?.trim()
  return placeId || null
}
