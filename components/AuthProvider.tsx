"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { fetchAuthRole, isTransientAuthRoleResponse } from "@/lib/authRoleClient"
import { isTreatedAsSignedOutAuthError } from "@/lib/supabaseAuthErrors"

type AuthContextValue = {
  user: User | null
  loading: boolean
  authError: string | null
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  signUpWithEmail: (
    email: string,
    password: string,
    role: "parent" | "provider" | "admin",
    profile: {
      fullName?: string
      businessName?: string
      phone?: string
      countryName?: string
      cityName?: string
      childAgeGroups?: string[]
      countryId?: string
      cityId?: string
      customCityName?: string
    },
  ) => Promise<{ error?: string }>
  signOut: () => Promise<{ error?: string }>
  signOutLocal: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | undefined
    let removeFocusListeners: (() => void) | undefined

    async function clearLocalSession() {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut({ scope: "local" }).catch(() => {
        /* ignore - storage may already be inconsistent */
      })

      if (!isMounted) return

      setUser(null)
      setAuthError(null)
    }

    async function validateResolvedRole() {
      try {
        const { response, payload } = await fetchAuthRole()

        if (!isMounted) return

        if (response.ok) {
          setAuthError(null)
          return
        }

        if (response.status === 401 || (response.status === 409 && payload.unresolvedRole)) {
          await clearLocalSession()
          return
        }

        if (isTransientAuthRoleResponse(response)) {
          console.warn("Current account role check temporarily unavailable", response.status)
          return
        }

        console.error("Error validating current account role", payload.error ?? response.statusText)
        setAuthError(payload.error ?? "Unable to validate account access.")
      } catch (error) {
        console.error("Current account role validation failed", error)
        if (isMounted) {
          setAuthError("Authentication service is currently unavailable.")
        }
      }
    }

    async function syncAuthenticatedUser() {
      try {
        const supabase = getSupabaseClient()
        const {
          data: { user: authenticatedUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (!isMounted) return

        if (userError) {
          if (isTreatedAsSignedOutAuthError(userError)) {
            await clearLocalSession()
          } else {
            console.error("Error validating Supabase user", userError)
            // Default to signed-out UI when validation fails to avoid stale dashboard links.
            setUser(null)
            setAuthError(userError.message)
          }
          return
        }

        setUser(authenticatedUser ?? null)
        setAuthError(null)

        if (authenticatedUser) {
          await validateResolvedRole()
        }
      } catch (error) {
        console.error("Supabase initialization error", error)
        if (isMounted) {
          setAuthError("Authentication service is currently unavailable.")
        }
      }
    }

    async function initAuth() {
      try {
        const supabase = getSupabaseClient()
        await syncAuthenticatedUser()

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!isMounted) return
          setUser(session?.user ?? null)
          setAuthError(null)
          if (session?.user) {
            void validateResolvedRole()
          }
        })

        unsubscribe = () => subscription.unsubscribe()

        const handleFocus = () => {
          void syncAuthenticatedUser()
        }

        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            void syncAuthenticatedUser()
          }
        }

        window.addEventListener("focus", handleFocus)
        document.addEventListener("visibilitychange", handleVisibilityChange)
        removeFocusListeners = () => {
          window.removeEventListener("focus", handleFocus)
          document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
      } catch (error) {
        console.error("Supabase initialization error", error)
        if (isMounted) {
          setAuthError("Authentication service is currently unavailable.")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void initAuth()

    return () => {
      isMounted = false
      if (unsubscribe) unsubscribe()
      if (removeFocusListeners) removeFocusListeners()
    }
  }, [])

  const signInWithEmail: AuthContextValue["signInWithEmail"] = useCallback(async (email, password) => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.error("Supabase sign-in error", error)
        return { error: error.message }
      }

      setUser(data.user ?? null)
      setAuthError(null)
      return {}
    } catch (error) {
      console.error("Supabase sign-in initialization error", error)
      return { error: "Unable to sign in right now. Please try again later." }
    }
  }, [])

  const signUpWithEmail: AuthContextValue["signUpWithEmail"] = useCallback(
    async (email, password, role, profile) => {
      try {
        const supabase = getSupabaseClient()
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            role,
            fullName: profile.fullName,
            businessName: profile.businessName,
            phone: profile.phone,
            countryName: profile.countryName,
            cityName: profile.cityName,
            childAgeGroups: profile.childAgeGroups,
            countryId: profile.countryId,
            cityId: profile.cityId,
            customCityName: profile.customCityName,
          }),
        })

        const payload = (await response.json()) as { error?: string }
        if (!response.ok) {
          return { error: payload.error ?? "Unable to create account right now. Please try again later." }
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          console.error("Supabase post-signup sign-in error", signInError)
          return { error: signInError.message }
        }

        return {}
      } catch (error) {
        console.error("Supabase sign-up initialization error", error)
        return { error: "Unable to sign up right now. Please try again later." }
      }
    },
    [],
  )

  const signOutLocal: AuthContextValue["signOutLocal"] = useCallback(async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut({ scope: "local" })
      setUser(null)
      setAuthError(null)
    } catch (error) {
      console.error("Supabase local sign-out error", error)
      setUser(null)
      setAuthError(null)
    }
  }, [])

  const signOut: AuthContextValue["signOut"] = useCallback(async () => {
    try {
      const supabase = getSupabaseClient()

      let serverError: string | null = null
      try {
        const response = await fetch("/api/auth/signout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string }
          serverError = payload.error ?? "Unable to sign out right now."
        }
      } catch {
        serverError = "Unable to sign out right now."
      }

      const { error: clientError } = await supabase.auth.signOut()

      if (serverError || clientError) {
        console.error("Supabase sign-out error", serverError ?? clientError)
        await signOutLocal()
        return {}
      }

      setUser(null)
      setAuthError(null)
      return {}
    } catch (error) {
      console.error("Supabase sign-out initialization error", error)
      await signOutLocal()
      return {}
    }
  }, [signOutLocal])

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      signOutLocal,
    }),
    [authError, loading, signInWithEmail, signOut, signOutLocal, signUpWithEmail, user],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}

