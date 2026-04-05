/**
 * GoTrue may log stale refresh-token failures with console.error before clearing the session.
 * Next.js dev treats console.error as a runtime error overlay. Filter expected signed-out noise.
 */
import { isTreatedAsSignedOutAuthError } from "@/lib/supabaseAuthErrors"

let patched = false

if (typeof window === "undefined" && process.env.NODE_ENV === "development" && !patched) {
  patched = true
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
