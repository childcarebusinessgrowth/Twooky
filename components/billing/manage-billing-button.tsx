"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type ButtonProps = React.ComponentProps<typeof Button>

export function ManageBillingButton({
  children = "Manage Billing",
  disabled,
  ...buttonProps
}: ButtonProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleClick() {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      })
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string
        url?: string
      }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Unable to open billing portal.")
      }

      window.location.assign(payload.url)
    } catch (error) {
      toast({
        title: "Billing action failed",
        description:
          error instanceof Error ? error.message : "Unable to open billing portal right now.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      {...buttonProps}
      disabled={disabled || isSubmitting}
      onClick={() => void handleClick()}
    >
      {isSubmitting ? "Redirecting..." : children}
    </Button>
  )
}
