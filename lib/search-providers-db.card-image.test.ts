import { describe, expect, it } from "vitest"
import { buildProviderCardImageUrl } from "./provider-card-image"

describe("buildProviderCardImageUrl", () => {
  const baseUrl = "https://abc.supabase.co"

  it("uses Supabase primary URL when primaryPath is set (ignores Google ref)", () => {
    const url = buildProviderCardImageUrl(
      "profiles/x/photo.jpg",
      "google-fallback/provider-x.jpg",
      "CmRaAAAA_should_be_ignored",
      baseUrl
    )
    expect(url).toBe(
      "https://abc.supabase.co/storage/v1/object/public/provider-photos/profiles/x/photo.jpg"
    )
    expect(url).not.toContain("place-photo")
  })

  it("uses cached Google storage path when no primary exists", () => {
    const url = buildProviderCardImageUrl(
      null,
      "google-fallback/provider-x.jpg",
      "CmRaAAAA_ref",
      baseUrl
    )
    expect(url).toBe(
      "https://abc.supabase.co/storage/v1/object/public/provider-photos/google-fallback/provider-x.jpg"
    )
    expect(url).not.toContain("place-photo")
  })

  it("uses Google proxy when no primary or cached fallback but photo_reference exists", () => {
    const url = buildProviderCardImageUrl(null, null, "CmRaAAAA_ref", baseUrl)
    expect(url).toMatch(/^\/api\/place-photo\?/)
    expect(url).toContain("photo_reference=CmRaAAAA_ref")
    expect(url).toContain("maxwidth=800")
  })

  it("uses placeholder when no primary/cached/google ref", () => {
    expect(buildProviderCardImageUrl(null, null, null, baseUrl)).toBe("/images/placeholder-provider.svg")
    expect(buildProviderCardImageUrl(null, null, "   ", baseUrl)).toBe("/images/placeholder-provider.svg")
  })
})
