/**
 * GoTrue calls console.error when token refresh fails, even though it then clears the session.
 * Next.js dev treats console.error as a runtime error overlay. Filter expected stale-session noise.
 */
import { isTreatedAsSignedOutAuthError } from "@/lib/supabaseAuthErrors"

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const original = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    for (const arg of args) {
      if (isTreatedAsSignedOutAuthError(arg)) {
        return
      }
    }
    original(...args)
  }
}
