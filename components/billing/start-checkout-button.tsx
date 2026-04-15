"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { PaidPlanId, BillingPeriod } from "@/lib/pricing-data"
import { useAuth } from "@/components/AuthProvider"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type ButtonProps = React.ComponentProps<typeof Button>

type CheckoutResponse = {
  error?: string
  redirect?: "checkout" | "portal"
  sessionId?: string
  url?: string | null
}

export function StartCheckoutButton({
  planId,
  billingPeriod,
  unauthenticatedHref = "/for-providers",
  children,
  disabled,
  ...buttonProps
}: ButtonProps & {
  planId: PaidPlanId
  billingPeriod: BillingPeriod
  unauthenticatedHref?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabled = disabled || loading || isSubmitting

  async function handleClick() {
    if (!user) {
      router.push(unauthenticatedHref)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId, billingPeriod }),
      })

      const payload = (await response.json().catch(() => ({}))) as CheckoutResponse
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to start checkout.")
      }

      if (payload.url && payload.redirect === "portal") {
        window.location.assign(payload.url)
        return
      }

      if (payload.url) {
        window.location.assign(payload.url)
        return
      }

      throw new Error("Missing Stripe checkout redirect URL.")
    } catch (error) {
      toast({
        title: "Billing action failed",
        description:
          error instanceof Error ? error.message : "Unable to start checkout right now.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button {...buttonProps} disabled={isDisabled} onClick={() => void handleClick()}>
      {isSubmitting ? "Redirecting..." : children}
    </Button>
  )
}
