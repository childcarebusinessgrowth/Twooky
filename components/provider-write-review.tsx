"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/components/AuthProvider"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { getProfileRoleForUser } from "@/lib/authz"
import { LoginToWriteReviewDialog } from "@/components/login-to-write-review-dialog"

type Props = {
  providerProfileId: string | null
  providerSlug: string
  providerName: string
  onSubmitted?: () => void
}

export function ProviderWriteReview({
  providerProfileId,
  providerSlug,
  providerName,
  onSubmitted,
}: Props) {
  const { user, loading: authLoading } = useAuth()
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [parentsOnlyOpen, setParentsOnlyOpen] = useState(false)
  const [notAvailableOpen, setNotAvailableOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roleChecked, setRoleChecked] = useState(false)
  const [isParent, setIsParent] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getProfileRoleForUser(getSupabaseClient(), user)
      .then((role) => {
        if (!cancelled) setIsParent(role === "parent")
      })
      .finally(() => {
        if (!cancelled) setRoleChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isParent || !providerProfileId) return
    setError(null)
    setSubmitting(true)
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        providerProfileId,
        rating,
        text,
      }),
    })
    const result = (await response.json().catch(() => null)) as { error?: string } | null
    setSubmitting(false)
    if (!response.ok) {
      setError(result?.error ?? "Failed to submit review.")
      return
    }
    setText("")
    setRating(0)
    setFormDialogOpen(false)
    onSubmitted?.()
  }

  const handleOpenForm = () => {
    setError(null)
    setFormDialogOpen(true)
  }

  const loginHref = `/login?next=${encodeURIComponent(`/providers/${providerSlug}`)}`
  const canSaveReview = !!providerProfileId
  const showDisabled = authLoading || (!!user && !roleChecked)
  const showLoginDialog = !user && !authLoading
  const showFormOnClick = user && isParent && canSaveReview
  const showParentsOnlyMessage = user && roleChecked && !isParent
  const showNotAvailableMessage = user && isParent && !canSaveReview

  const handleButtonClick = () => {
    if (showLoginDialog) setLoginDialogOpen(true)
    if (showFormOnClick) handleOpenForm()
    if (showParentsOnlyMessage) setParentsOnlyOpen(true)
    if (showNotAvailableMessage) setNotAvailableOpen(true)
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
        disabled={showDisabled}
        onClick={handleButtonClick}
      >
        Write a Review
      </Button>

      <LoginToWriteReviewDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        loginHref={loginHref}
      />

      <Dialog open={parentsOnlyOpen} onOpenChange={setParentsOnlyOpen}>
        <DialogContent
          showCloseButton={true}
          className="rounded-2xl border-border/60 p-0 overflow-hidden shadow-xl sm:max-w-md"
        >
          <div className="px-6 pt-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold tracking-tight text-foreground">
                Parent accounts only
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 py-4">
            <DialogDescription className="text-center text-muted-foreground leading-relaxed">
              Only parent accounts can write reviews. Sign in with a parent account to
              share your experience.
            </DialogDescription>
          </div>
          <DialogFooter className="border-t border-border/60 bg-muted/30 px-6 py-4">
            <Button
              className="rounded-full w-full sm:w-auto"
              onClick={() => setParentsOnlyOpen(false)}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notAvailableOpen} onOpenChange={setNotAvailableOpen}>
        <DialogContent
          showCloseButton={true}
          className="rounded-2xl border-border/60 p-0 overflow-hidden shadow-xl sm:max-w-md"
        >
          <div className="px-6 pt-6 pb-2">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold tracking-tight text-foreground">
                Reviews not available yet
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 py-4">
            <DialogDescription className="text-center text-muted-foreground leading-relaxed">
              This provider listing doesn&apos;t support reviews yet. Reviews will be
              available when they join the directory.
            </DialogDescription>
          </div>
          <DialogFooter className="border-t border-border/60 bg-muted/30 px-6 py-4">
            <Button
              className="rounded-full w-full sm:w-auto"
              onClick={() => setNotAvailableOpen(false)}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent
          showCloseButton={true}
          className="rounded-2xl border-border/60 p-0 overflow-hidden shadow-xl sm:max-w-md"
        >
          <div className="bg-linear-to-b from-primary/10 to-transparent px-6 pt-8 pb-2">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold tracking-tight text-foreground">
                Review {providerName}
              </DialogTitle>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <DialogDescription className="text-muted-foreground text-center">
              Share your experience to help other families.
            </DialogDescription>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="p-0.5 focus:outline-none"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star
                    className={`h-7 w-7 ${
                      value <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Share your experience with this provider..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <DialogFooter className="flex flex-col-reverse gap-2 border-t border-border/60 bg-muted/30 -mx-6 mb-0 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                className="rounded-full border-border/60"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full font-medium shadow-sm"
                disabled={submitting || rating < 1 || !text.trim()}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
