import { describe, expect, it } from "vitest"
import {
  formatUtcDateBucket,
  isLikelyVisitorToken,
  PROVIDER_PROFILE_VISITOR_COOKIE_NAME,
} from "@/lib/providerProfileViews"

describe("providerProfileViews", () => {
  it("exposes a stable visitor cookie name", () => {
    expect(PROVIDER_PROFILE_VISITOR_COOKIE_NAME).toBe("eld_provider_profile_visitor")
  })

  it("validates likely visitor tokens", () => {
    expect(isLikelyVisitorToken("abc12345")).toBe(true)
    expect(isLikelyVisitorToken("token_with-underscore")).toBe(true)
    expect(isLikelyVisitorToken("short")).toBe(false)
    expect(isLikelyVisitorToken("invalid token")).toBe(false)
  })

  it("formats UTC date buckets consistently", () => {
    expect(formatUtcDateBucket(new Date("2026-04-14T23:59:59Z"))).toBe("2026-04-14")
    expect(formatUtcDateBucket(new Date("2026-04-15T00:00:00Z"))).toBe("2026-04-15")
  })
})
