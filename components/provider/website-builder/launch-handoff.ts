"use client"

import type { WebsiteState } from "@/app/dashboard/provider/website/actions"

export const PENDING_OPEN_STORAGE_KEY = "provider-website-builder-pending-open"

const WEBSITE_STATE_HANDOFF_STORAGE_KEY = "provider-website-builder-launch-state"
const HANDOFF_MAX_AGE_MS = 5 * 60 * 1000

type WebsiteLaunchHandoff = {
  createdAt: number
  state: WebsiteState
}

export function persistWebsiteLaunchState(state: WebsiteState) {
  if (typeof window === "undefined") return
  const payload: WebsiteLaunchHandoff = { createdAt: Date.now(), state }
  sessionStorage.setItem(PENDING_OPEN_STORAGE_KEY, "1")
  sessionStorage.setItem(WEBSITE_STATE_HANDOFF_STORAGE_KEY, JSON.stringify(payload))
}

export function consumeWebsiteLaunchState(): WebsiteState | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(WEBSITE_STATE_HANDOFF_STORAGE_KEY)
  if (!raw) return null
  sessionStorage.removeItem(WEBSITE_STATE_HANDOFF_STORAGE_KEY)

  try {
    const parsed = JSON.parse(raw) as Partial<WebsiteLaunchHandoff>
    if (!parsed.state || typeof parsed.createdAt !== "number") return null
    if (Date.now() - parsed.createdAt > HANDOFF_MAX_AGE_MS) return null
    return parsed.state
  } catch {
    return null
  }
}

export function clearWebsiteLaunchState() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(PENDING_OPEN_STORAGE_KEY)
  sessionStorage.removeItem(WEBSITE_STATE_HANDOFF_STORAGE_KEY)
}
