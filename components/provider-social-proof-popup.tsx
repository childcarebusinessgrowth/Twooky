"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

type SocialProofItem = {
  id: string
  type: "text" | "image" | "video"
  content: string
  rating: number | null
  imageUrl: string | null
  videoUrl: string | null
  authorName: string | null
}

type SocialProofResponse = {
  profileUrl: string
  items: SocialProofItem[]
}

type Props = {
  providerSlug: string
}

export function ProviderSocialProofPopup({ providerSlug }: Props) {
  const [items, setItems] = useState<SocialProofItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [profileUrl, setProfileUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/social-proof?provider=${encodeURIComponent(providerSlug)}`)
      .then(async (response) => {
        if (!response.ok) return null
        const payload = (await response.json()) as SocialProofResponse
        return payload
      })
      .then((payload) => {
        if (cancelled || !payload || !Array.isArray(payload.items)) return
        setItems(payload.items)
        setProfileUrl(payload.profileUrl)
      })
      .catch(() => {
        // ignore request errors for optional UI
      })

    return () => {
      cancelled = true
    }
  }, [providerSlug])

  useEffect(() => {
    if (items.length === 0) return

    const VISIBLE_MS = 5000
    const GAP_MS = 600

    let hideTimer: number | null = null
    let nextTimer: number | null = null

    const cycle = () => {
      setIsVisible(true)
      hideTimer = window.setTimeout(() => setIsVisible(false), VISIBLE_MS)
      nextTimer = window.setTimeout(() => {
        setCurrentIndex((current) => (current + 1) % items.length)
        cycle()
      }, VISIBLE_MS + GAP_MS)
    }

    cycle()

    return () => {
      if (hideTimer != null) window.clearTimeout(hideTimer)
      if (nextTimer != null) window.clearTimeout(nextTimer)
    }
  }, [items])

  const activeItem = useMemo(() => items[currentIndex], [items, currentIndex])

  if (!activeItem || !profileUrl) {
    return null
  }

  return (
    <a
      href={profileUrl}
      className={cn(
        "font-sans fixed bottom-4 left-4 z-50 w-[min(340px,calc(100vw-2rem))] rounded-xl border border-[#D8E1F3] bg-card/95 p-3 text-card-foreground shadow-2xl backdrop-blur transition duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none",
      )}
      aria-label="View provider on Twooky"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-muted">
          <Image
            src={activeItem.imageUrl || "/images/twooky-logo.png"}
            alt="Social proof"
            fill
            className="object-cover"
            sizes="40px"
            unoptimized={Boolean(activeItem.imageUrl)}
          />
        </div>
        <div className="min-w-0 flex-1">
          {activeItem.rating != null && (
            <div className="mb-1 flex items-center gap-0.5 text-[#F9BB11]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className={cn("h-3.5 w-3.5", index < activeItem.rating! ? "fill-current" : "")} />
              ))}
            </div>
          )}
          <p className="line-clamp-2 text-sm">&quot;{activeItem.content}&quot;</p>
          {activeItem.authorName && (
            <p className="mt-1 text-xs text-muted-foreground">- {activeItem.authorName}</p>
          )}
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="rounded-full border border-[#E7D59A] bg-[#F9BB11] px-2 py-0.5 font-semibold text-[#203E68]">
              Verified by Twooky
            </span>
            <span>{activeItem.type === "video" ? "Video testimonial" : "Parent feedback"}</span>
          </div>
        </div>
      </div>
    </a>
  )
}
