"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDefaultRouteForRole, isAppRole } from "@/lib/authz"
import { getSupabaseClient } from "@/lib/supabaseClient"

const ROLE_UNRESOLVED_MESSAGE =
  "Your password was updated, but we could not determine your role. Please contact support or sign in from the login page."

/** Split fragment/query like `a=b&c=d` where values may contain `=` (e.g. JWT). */
function parseAmpDelimitedParams(segment: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!segment) return out
  const trimmed = segment.startsWith("#") ? segment.slice(1) : segment
  for (const part of trimmed.split("&")) {
    const eq = part.indexOf("=")
    if (eq <= 0) continue
    const key = decodeURIComponent(part.slice(0, eq))
    const value = decodeURIComponent(part.slice(eq + 1))
    out[key] = value
  }
  return out
}

function getAuthParamsFromUrl(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const fromSearch = parseAmpDelimitedParams(window.location.search.replace(/^\?/, ""))
  const fromHash = parseAmpDelimitedParams(window.location.hash)
  return { ...fromHash, ...fromSearch }
}

/**
 * `createBrowserClient` from @supabase/ssr forces `flowType: "pkce"`, but recovery links from
 * `auth.admin.generateLink` redirect with implicit-grant tokens in the hash. GoTrue refuses to
 * parse that URL when the client is PKCE-only — we apply the session from the URL explicitly.
 */
async function establishRecoverySessionFromUrl(supabase: ReturnType<typeof getSupabaseClient>): Promise<
  "ok" | "none" | "error"
> {
  const searchParams = new URLSearchParams(window.location.search)
  const code = searchParams.get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return "ok"
    }
    // PKCE exchange often fails for email links (no code verifier in this browser). Try hash/query below.
  }

  const token_hash = searchParams.get("token_hash")
  const typeParam = searchParams.get("type")
  if (token_hash && typeParam === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash,
    })
    if (!error) {
      return "ok"
    }
    return "error"
  }

  const params = getAuthParamsFromUrl()
  const access_token = params.access_token
  const refresh_token = params.refresh_token
  const type = params.type
  const hashStr = typeof window !== "undefined" ? window.location.hash : ""
  const hashSaysRecovery =
    hashStr.includes("type=recovery") || hashStr.includes("type%3Drecovery")

  const looksLikeImplicitRecovery =
    Boolean(access_token && refresh_token) &&
    (type === "recovery" || (hashSaysRecovery && type !== "magiclink" && type !== "signup"))

  if (looksLikeImplicitRecovery) {
    const { error } = await supabase.auth.setSession({
      access_token: access_token!,
      refresh_token: refresh_token!,
    })
    if (!error) {
      return "ok"
    }
    return "error"
  }

  return "none"
}

function clearRecoveryParamsFromUrl(): void {
  if (typeof window === "undefined") return
  window.history.replaceState(null, "", window.location.pathname)
}

type Phase = "loading" | "form" | "invalid"

function urlHasRecoverySignals(): boolean {
  if (typeof window === "undefined") return false
  const h = window.location.hash
  const s = window.location.search
  return (
    h.includes("access_token") ||
    h.includes("type=recovery") ||
    h.includes("type%3Drecovery") ||
    s.includes("code=") ||
    s.includes("token_hash=") ||
    s.includes("access_token")
  )
}

export function UpdatePasswordForm() {
  const router = useRouter()
  const initialUrlHadRecoverySignals = useRef(false)
  const [phase, setPhase] = useState<Phase>("loading")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initialUrlHadRecoverySignals.current = urlHasRecoverySignals()
    const supabase = getSupabaseClient()
    let cancelled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setPhase("form")
        return
      }
      // Recovery completion often emits SIGNED_IN (implicit tokens / PKCE), not PASSWORD_RECOVERY.
      if (event === "SIGNED_IN" && session && initialUrlHadRecoverySignals.current) {
        setPhase((p) => (p === "loading" ? "form" : p))
      }
    })

    void (async () => {
      const established = await establishRecoverySessionFromUrl(supabase)
      if (cancelled) return

      if (established === "ok") {
        setPhase("form")
        return
      }
      if (established === "error") {
        setPhase("invalid")
        return
      }

      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return
        if (session && initialUrlHadRecoverySignals.current) {
          setPhase("form")
        }
      })
    })()

    const timeoutId = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return
        setPhase((current) => {
          if (current !== "loading") return current
          if (session && initialUrlHadRecoverySignals.current) return "form"
          return "invalid"
        })
      })
    }, 6000)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.clearTimeout(timeoutId)
    }
  }, [])

  const resolveRoleRedirect = async (): Promise<{ redirectPath: string } | { unresolvedRole: true }> => {
    const response = await fetch("/api/auth/role", { cache: "no-store" })
    const data = (await response.json().catch(() => ({}))) as {
      redirectPath?: string
      unresolvedRole?: boolean
    }

    if (response.status === 409 && data.unresolvedRole) {
      return { unresolvedRole: true }
    }

    if (!response.ok || !data.redirectPath) {
      throw new Error("Missing role redirect path")
    }

    return { redirectPath: data.redirectPath }
  }

  const resolveRoleRedirectFallback = async (): Promise<string | null> => {
    const supabase = getSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const roleCandidate = user?.app_metadata?.role ?? user?.user_metadata?.role
    return isAppRole(roleCandidate) ? getDefaultRouteForRole(roleCandidate) : null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = getSupabaseClient()

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      if (!currentSession) {
        const established = await establishRecoverySessionFromUrl(supabase)
        if (established !== "ok") {
          setError("Your reset link is missing a valid session. Please request a new link and open it once.")
          return
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      clearRecoveryParamsFromUrl()

      try {
        const roleResult = await resolveRoleRedirect()
        if ("unresolvedRole" in roleResult) {
          setError(ROLE_UNRESOLVED_MESSAGE)
          return
        }
        router.replace(roleResult.redirectPath)
        router.refresh()
      } catch {
        try {
          const fallbackPath = await resolveRoleRedirectFallback()
          if (fallbackPath) {
            router.replace(fallbackPath)
            router.refresh()
            return
          }
          setError(ROLE_UNRESOLVED_MESSAGE)
        } catch {
          setError(ROLE_UNRESOLVED_MESSAGE)
        }
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (phase === "loading") {
    return (
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardContent className="pt-8 pb-8">
          <p className="text-center text-sm text-muted-foreground">Checking your reset link…</p>
        </CardContent>
      </Card>
    )
  }

  if (phase === "invalid") {
    return (
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Link invalid or expired</CardTitle>
          <CardDescription>
            Open the reset link from your email, or request a new one from the forgot password page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" size="lg">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-border/50">
      <CardHeader>
        <Link
          href="/login"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <span className="hover:underline">Back to login</span>
        </Link>
        <CardTitle className="text-2xl font-bold">Choose a new password</CardTitle>
        <CardDescription>Enter a new password for your Twooky account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="new-password">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="confirm-password">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm your password"
                className="pl-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded border-input"
            />
            Show passwords
          </label>
          <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Update password"}
          </Button>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  )
}
