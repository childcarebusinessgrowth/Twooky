"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/AuthProvider"
import { getProfileRoleForUser } from "@/lib/authz"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { GuestInquiryForm } from "@/components/guest-inquiry-form"

type Props = {
  providerSlug: string
  providerName?: string
  className?: string
  /** Lead source: directory (default) or compare */
  source?: "directory" | "compare"
}

export function SendInquiryButton({ providerSlug, providerName, className, source = "directory" }: Props) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [role, setRole] = useState<"parent" | "provider" | "admin" | null>(null)
  const [checking, setChecking] = useState(true)
  const [guestModalOpen, setGuestModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (authLoading) return () => { cancelled = true }
    if (!user) {
      queueMicrotask(() => {
        if (!cancelled) {
          setRole(null)
          setChecking(false)
        }
      })
      return () => { cancelled = true }
    }
    getProfileRoleForUser(getSupabaseClient(), user)
      .then((r) => {
        if (!cancelled) setRole(r ?? null)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => { cancelled = true }
  }, [user, authLoading])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({ provider: providerSlug })
    if (source === "compare") params.set("source", "compare")
    const next = `/dashboard/parent/inquiries?${params.toString()}`
    if (role === "parent") {
      router.push(next)
      return
    }
    if (!user) {
      setGuestModalOpen(true)
      return
    }
    router.push("/contact")
  }

  const parentParams = new URLSearchParams({ provider: providerSlug })
  if (source === "compare") parentParams.set("source", "compare")
  const href =
    role === "parent"
      ? `/dashboard/parent/inquiries?${parentParams.toString()}`
      : !user
        ? "#"
        : "/contact"

  return (
    <>
      {checking || authLoading ? (
        <Button variant="secondary" className={className ?? "w-full"} asChild>
          <a href={href}>Send Inquiry</a>
        </Button>
      ) : (
        <Button
          variant="secondary"
          className={className ?? "w-full"}
          asChild={!user ? undefined : true}
          onClick={!user ? () => setGuestModalOpen(true) : undefined}
        >
          {!user ? (
            <span>Send Inquiry</span>
          ) : (
            <a href={href} onClick={handleClick}>
              Send Inquiry
            </a>
          )}
        </Button>
      )}
      <GuestInquiryForm
        open={guestModalOpen}
        onOpenChange={setGuestModalOpen}
        providerSlug={providerSlug}
        providerName={providerName}
        source={source}
      />
    </>
  )
}
