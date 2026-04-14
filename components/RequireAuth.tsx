"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/components/AuthProvider"
import { fetchAuthRole, isTransientAuthRoleResponse } from "@/lib/authRoleClient"
import { getDefaultRouteForRole, isAppRole } from "@/lib/authz"

type RequireAuthProps = {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
  allowedRoles?: Array<"parent" | "provider" | "admin">
}

export function RequireAuth({ children, redirectTo = "/login", fallback, allowedRoles }: RequireAuthProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { signOutLocal } = useAuth()
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const hasRoleConstraints = Array.isArray(allowedRoles) && allowedRoles.length > 0
  const allowedRolesKey = hasRoleConstraints ? allowedRoles.join(",") : ""
  const allowedRoleSet = useMemo(
    () => new Set((allowedRolesKey ? allowedRolesKey.split(",") : []).filter(isAppRole)),
    [allowedRolesKey],
  )

  useEffect(() => {
    let cancelled = false
    let shouldKeepLoading = false
    setIsCheckingAccess(true)
    setIsAuthorized(false)

    void (async () => {
      try {
        const { response, payload } = await fetchAuthRole()

        if (cancelled) return

        if (!response.ok) {
          if (response.status === 401 || (response.status === 409 && payload.unresolvedRole)) {
            await signOutLocal()
          } else if (isTransientAuthRoleResponse(response)) {
            shouldKeepLoading = true
            window.setTimeout(() => {
              if (!cancelled) {
                router.refresh()
              }
            }, 300)
            return
          }

          const queryParams = new URLSearchParams()
          if (payload.unresolvedRole) {
            queryParams.set("error", "role_unresolved")
          } else if (pathname) {
            queryParams.set("next", pathname)
          }

          const queryString = queryParams.toString()
          router.replace(queryString ? `${redirectTo}?${queryString}` : redirectTo)
          return
        }

        const role = isAppRole(payload.role) ? payload.role : null

        if (!role && hasRoleConstraints) {
          router.replace(`${redirectTo}?error=role_unresolved`)
          return
        }

        if (role && hasRoleConstraints && !allowedRoleSet.has(role)) {
          router.replace(getDefaultRouteForRole(role))
          return
        }

        setIsAuthorized(true)
      } catch {
        if (cancelled) return
        router.replace(redirectTo)
      } finally {
        if (!cancelled && !shouldKeepLoading) {
          setIsCheckingAccess(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [allowedRoleSet, hasRoleConstraints, pathname, redirectTo, router, signOutLocal])

  if (isCheckingAccess || !isAuthorized) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return <>{children}</>
}

