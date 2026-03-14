"use client"

import { useState, useEffect, useCallback } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/AuthProvider"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { getProfileRoleForUser } from "@/lib/authz"
import {
  getLocalFavoriteSlugs,
  setLocalFavoriteSlugs,
} from "@/lib/local-favorites"
import { LoginToSaveFavoritesDialog } from "@/components/login-to-save-favorites-dialog"

type Props = {
  providerSlug: string
}

/**
 * Shown when the provider is not in the DB (e.g. mock listing). For logged-out
 * users, clicking the heart opens the login modal. For logged-in parents, the
 * heart saves/unsaves to localStorage (so it works on this device).
 */
export function ProviderFavoriteLoginPrompt({ providerSlug }: Props) {
  const { user, loading: authLoading } = useAuth()
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [isParent, setIsParent] = useState(false)
  const [roleChecked, setRoleChecked] = useState(false)
  const [savedLocally, setSavedLocally] = useState(false)

  useEffect(() => {
    setSavedLocally(getLocalFavoriteSlugs().includes(providerSlug))
  }, [providerSlug])

  useEffect(() => {
    if (!user) {
      setRoleChecked(true)
      return
    }
    getProfileRoleForUser(getSupabaseClient(), user)
      .then((role) => {
        setIsParent(role === "parent")
      })
      .finally(() => {
        setRoleChecked(true)
      })
  }, [user])

  const toggleLocalFavorite = useCallback(() => {
    const slugs = getLocalFavoriteSlugs()
    const next = slugs.includes(providerSlug)
      ? slugs.filter((s) => s !== providerSlug)
      : [...slugs, providerSlug]
    setLocalFavoriteSlugs(next)
    setSavedLocally(next.includes(providerSlug))
  }, [providerSlug])

  const loginHref = `/login?next=${encodeURIComponent(`/providers/${providerSlug}`)}`

  if (authLoading || !roleChecked) {
    return (
      <Button variant="outline" size="icon" disabled aria-label="Save provider">
        <Heart className="h-5 w-5 text-muted-foreground" />
      </Button>
    )
  }

  if (user && isParent) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={toggleLocalFavorite}
        aria-label={savedLocally ? "Unsave provider" : "Save provider"}
      >
        <Heart
          className={`h-5 w-5 ${savedLocally ? "fill-primary text-primary" : ""}`}
        />
      </Button>
    )
  }

  if (user && !isParent) {
    return (
      <Button variant="outline" size="icon" disabled aria-label="Save provider">
        <Heart className="h-5 w-5 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setLoginModalOpen(true)}
        aria-label="Save provider (sign in)"
      >
        <Heart className="h-5 w-5" />
      </Button>
      <LoginToSaveFavoritesDialog
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        loginHref={loginHref}
      />
    </>
  )
}
