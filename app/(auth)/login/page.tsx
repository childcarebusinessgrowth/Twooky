"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Mail, Lock, Eye, EyeOff, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { useAuth } from "@/components/AuthProvider"
import { getDefaultRouteForRole, isAppRole } from "@/lib/authz"
import { getSupabaseClient } from "@/lib/supabaseClient"

const ROLE_UNRESOLVED_MESSAGE =
  "Your account is signed in, but we could not determine your role. Please contact support to finish account setup."

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const getSafeNextPath = (): string | null => {
    const nextValue = searchParams.get("next")
    if (!nextValue) return null
    if (!nextValue.startsWith("/")) return null
    if (nextValue.startsWith("//")) return null
    if (nextValue.startsWith("/login") || nextValue.startsWith("/signup")) return null
    return nextValue
  }

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { signInWithEmail, authError } = useAuth()

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }
    if (!password) {
      setError("Please enter your password.")
      return
    }

    setIsLoading(true)
    setError(null)

    const { error } = await signInWithEmail(email, password)

    setIsLoading(false)

    if (error) {
      setError(error)
      return
    }

    const nextPath = getSafeNextPath()
    if (nextPath) {
      router.replace(nextPath)
      router.refresh()
      return
    }

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
  }

  const queryError = searchParams.get("error")
  const queryMessage = queryError === "role_unresolved" ? ROLE_UNRESOLVED_MESSAGE : null

  return (
    <Card className="w-full max-w-md shadow-lg border-border/50 bg-card/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-5 w-5" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Sign in to continue exploring trusted early learning providers.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <form onSubmit={handleLogin}>
          <FieldGroup>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Password</FieldLabel>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </FieldGroup>
        </form>

        {(error || authError || queryMessage) && (
          <p className="mt-4 text-sm text-destructive text-center">
            {error ?? authError ?? queryMessage}
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          {"Don't have an account? "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
