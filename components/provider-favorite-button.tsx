"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/AuthProvider"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { addFavorite, isFavorited, removeFavorite } from "@/lib/parent-engagement"
import { getProfileRoleForUser } from "@/lib/authz"
import { LoginToSaveFavoritesDialog } from "@/components/login-to-save-favorites-dialog"

type Props = {
  providerProfileId: string
  providerSlug: string
}

export function ProviderFavoriteButton({ providerProfileId, providerSlug }: Props) {
  const { user, loading: authLoading } = useAuth()
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isParent, setIsParent] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (authLoading) {
      return () => {
        cancelled = true
      }
    }
    if (!user) {
      queueMicrotask(() => {
        if (!cancelled) setChecking(false)
      })
      return () => {
        cancelled = true
      }
    }
    getProfileRoleForUser(getSupabaseClient(), user)
      .then((role) => {
        if (cancelled) return
        setIsParent(role === "parent")
        if (role === "parent") {
          return isFavorited(getSupabaseClient(), user.id, providerProfileId).then(
            (ok) => {
              if (!cancelled) setFavorited(ok)
            }
          )
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, authLoading, providerProfileId])

  const handleToggle = async () => {
    if (!user || !isParent) return
    setLoading(true)
    const supabase = getSupabaseClient()
    if (favorited) {
      const { error } = await removeFavorite(supabase, user.id, providerProfileId)
      if (!error) setFavorited(false)
    } else {
      const { error } = await addFavorite(supabase, user.id, providerProfileId)
      if (!error) setFavorited(true)
    }
    setLoading(false)
  }

  if (authLoading || checking) {
    return (
      <Button variant="outline" size="icon" disabled aria-label="Save provider">
        <Heart className="h-5 w-5 text-muted-foreground" />
      </Button>
    )
  }

  if (!user) {
    const loginHref = `/login?next=${encodeURIComponent(`/providers/${providerSlug}`)}`
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

  if (!isParent) {
    return (
      <Button variant="outline" size="icon" aria-label="Save provider">
        <Heart className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => void handleToggle()}
      disabled={loading}
      aria-label={favorited ? "Unsave provider" : "Save provider"}
    >
      <Heart
        className={`h-5 w-5 ${favorited ? "fill-primary text-primary" : ""}`}
      />
    </Button>
  )
}
