import { describe, expect, it } from "vitest"
import { parseVisitorGeoFromHeaders, visitorHasLatLng } from "./visitor-geo"

describe("parseVisitorGeoFromHeaders", () => {
  it("returns null when no geo headers are present", () => {
    expect(parseVisitorGeoFromHeaders(new Headers())).toBeNull()
  })

  it("parses Vercel city, country, and coordinates", () => {
    const h = new Headers({
      "x-vercel-ip-city": "London",
      "x-vercel-ip-country": "gb",
      "x-vercel-ip-latitude": "51.5074",
      "x-vercel-ip-longitude": "-0.1278",
    })
    expect(parseVisitorGeoFromHeaders(h)).toEqual({
      city: "London",
      countryCode: "GB",
      latitude: 51.5074,
      longitude: -0.1278,
    })
  })

  it("decodes percent-encoded city names", () => {
    const h = new Headers({
      "x-vercel-ip-city": "S%C3%A3o%20Paulo",
      "x-vercel-ip-country": "BR",
    })
    expect(parseVisitorGeoFromHeaders(h)?.city).toBe("São Paulo")
  })

  it("falls back to Cloudflare headers when Vercel is absent", () => {
    const h = new Headers({
      "cf-ipcity": "Toronto",
      "cf-ipcountry": "ca",
    })
    expect(parseVisitorGeoFromHeaders(h)).toEqual({
      city: "Toronto",
      countryCode: "CA",
      latitude: null,
      longitude: null,
    })
  })
})

describe("visitorHasLatLng", () => {
  it("is true only when both coordinates are finite numbers", () => {
    expect(
      visitorHasLatLng({
        city: null,
        countryCode: null,
        latitude: 1,
        longitude: 2,
      })
    ).toBe(true)
    expect(
      visitorHasLatLng({
        city: null,
        countryCode: null,
        latitude: null,
        longitude: 2,
      })
    ).toBe(false)
  })
})
