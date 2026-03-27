/**
 * Supabase auth errors that mean "no valid session" — not an app bug.
 * Calling code should treat these as signed out (and avoid console.error in dev overlays).
 */
export function isTreatedAsSignedOutAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const e = error as {
    name?: string
    message?: string
    status?: number
    code?: string
    __isAuthError?: boolean
  }

  if (e.name === "AuthSessionMissingError" && e.status === 400 && e.__isAuthError) {
    return true
  }

  if (e.code === "refresh_token_not_found") {
    return true
  }

  if (e.name === "AuthApiError" && typeof e.message === "string") {
    const m = e.message.toLowerCase()
    if (m.includes("invalid refresh token") || m.includes("refresh token not found")) {
      return true
    }
  }

  if (e.__isAuthError && typeof e.message === "string") {
    const m = e.message.toLowerCase()
    if (m.includes("invalid refresh token") || m.includes("refresh token not found")) {
      return true
    }
  }

  return false
}
