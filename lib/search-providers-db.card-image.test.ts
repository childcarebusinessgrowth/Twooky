import { describe, expect, it } from "vitest"
import { buildProviderCardImageUrl } from "./provider-card-image"

describe("buildProviderCardImageUrl", () => {
  const baseUrl = "https://abc.supabase.co"

  it("uses Supabase primary URL when primaryPath is set (ignores Google ref)", () => {
    const url = buildProviderCardImageUrl(
      "profiles/x/photo.jpg",
      "CmRaAAAA_should_be_ignored",
      baseUrl
    )
    expect(url).toBe(
      "https://abc.supabase.co/storage/v1/object/public/provider-photos/profiles/x/photo.jpg"
    )
    expect(url).not.toContain("place-photo")
  })

  it("uses Google proxy when no primary but photo_reference exists", () => {
    const url = buildProviderCardImageUrl(null, "CmRaAAAA_ref", baseUrl)
    expect(url).toMatch(/^\/api\/place-photo\?/)
    expect(url).toContain("photo_reference=CmRaAAAA_ref")
    expect(url).toContain("maxwidth=800")
  })

  it("uses placeholder when neither primary nor Google ref", () => {
    expect(buildProviderCardImageUrl(null, null, baseUrl)).toBe("/images/placeholder-provider.svg")
    expect(buildProviderCardImageUrl(null, "   ", baseUrl)).toBe("/images/placeholder-provider.svg")
  })
})
