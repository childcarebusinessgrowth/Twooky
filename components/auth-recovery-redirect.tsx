"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

/**
 * Supabase may send recovery redirects to the project Site URL (e.g. /) if
 * /update-password is not in Auth redirect URLs. When the hash still contains
 * recovery tokens, send the user to the password form with the same fragment.
 */
export function AuthRecoveryRedirect() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === "/update-password") return
    if (typeof window === "undefined") return

    const search = window.location.search
    if (search.includes("code=")) {
      window.location.replace(`${window.location.origin}/update-password${search}`)
      return
    }

    const raw = window.location.hash
    if (!raw || raw.length < 2) return

    const params = new URLSearchParams(raw.startsWith("#") ? raw.slice(1) : raw)
    const type = params.get("type")
    const hasAccess = Boolean(params.get("access_token")?.length)

    if (type === "recovery" && hasAccess) {
      const target = `${window.location.origin}/update-password${raw}`
      window.location.replace(target)
    }
  }, [pathname])

  return null
}
