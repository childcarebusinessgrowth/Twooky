"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/AuthProvider"
import { confirmProviderEmailChange } from "@/app/dashboard/provider/settings/actions"

type Phase = "loading" | "success" | "invalid" | "error"

export default function ConfirmEmailChangePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signOutLocal } = useAuth()
  const redirectTimer = useRef<number | null>(null)
  const [phase, setPhase] = useState<Phase>("loading")
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("token")?.trim() ?? ""
    if (!token) {
      setPhase("invalid")
      setMessage("This confirmation link is missing a token.")
      return
    }

    let cancelled = false

    void (async () => {
      const result = await confirmProviderEmailChange(token)
      if (cancelled) return

      if (!result.ok) {
        setPhase(result.status === "expired" || result.status === "used" ? "invalid" : "error")
        setMessage(result.error)
        return
      }

      setPhase("success")
      await signOutLocal()

      redirectTimer.current = window.setTimeout(() => {
        router.replace("/login?notice=email_changed")
        router.refresh()
      }, 1200)
    })()

    return () => {
      cancelled = true
      if (redirectTimer.current) {
        window.clearTimeout(redirectTimer.current)
      }
    }
  }, [router, searchParams, signOutLocal])

  if (phase === "loading") {
    return (
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardContent className="flex items-center justify-center gap-2 py-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Confirming your email change…</p>
        </CardContent>
      </Card>
    )
  }

  if (phase === "success") {
    return (
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <CardTitle className="text-2xl font-bold">Email updated</CardTitle>
          </div>
          <CardDescription>
            Your provider account email was updated successfully. You&apos;ll be redirected to sign in again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" size="lg">
            <Link href="/login?notice=email_changed">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === "invalid") {
    return (
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle className="text-2xl font-bold">Link invalid or expired</CardTitle>
          </div>
          <CardDescription>
            This confirmation link can only be used once and expires after a short time. Request a new email change from settings if
            you still need to update your login email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button asChild className="w-full" size="lg">
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-border/50">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <CardTitle className="text-2xl font-bold">Unable to confirm email change</CardTitle>
        </div>
        <CardDescription>
          We couldn&apos;t apply the email change right now. You can try again from the confirmation link or contact support if the
          problem continues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Back to login</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
