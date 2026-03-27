import { describe, expect, it } from "vitest"
import { isTreatedAsSignedOutAuthError } from "./supabaseAuthErrors"

describe("isTreatedAsSignedOutAuthError", () => {
  it("returns true for missing session error", () => {
    expect(
      isTreatedAsSignedOutAuthError({
        name: "AuthSessionMissingError",
        status: 400,
        __isAuthError: true,
      }),
    ).toBe(true)
  })

  it("returns true for invalid refresh token messages", () => {
    expect(
      isTreatedAsSignedOutAuthError({
        message: "Invalid Refresh Token: Refresh Token Not Found",
        __isAuthError: true,
      }),
    ).toBe(true)
  })

  it("returns true for refresh_token_not_found code", () => {
    expect(isTreatedAsSignedOutAuthError({ code: "refresh_token_not_found" })).toBe(true)
  })

  it("returns true for AuthApiError by name when message matches", () => {
    expect(
      isTreatedAsSignedOutAuthError({
        name: "AuthApiError",
        message: "Invalid Refresh Token: Refresh Token Not Found",
      }),
    ).toBe(true)
  })

  it("returns false for unrelated errors", () => {
    expect(isTreatedAsSignedOutAuthError(new Error("network"))).toBe(false)
    expect(isTreatedAsSignedOutAuthError(null)).toBe(false)
  })
})
