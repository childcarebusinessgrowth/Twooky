"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"

type DeferredClientRenderProps = {
  children: ReactNode
  timeoutMs?: number
}

/**
 * Defers mounting non-critical UI to idle time to reduce startup main-thread work.
 */
export function DeferredClientRender({
  children,
  timeoutMs = 2000,
}: DeferredClientRenderProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (handle: number) => void
    }

    let cancelled = false
    let timeoutId: number | null = null
    let idleId: number | null = null

    const show = () => {
      if (!cancelled) {
        setReady(true)
      }
    }

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(show, { timeout: timeoutMs })
    } else {
      timeoutId = window.setTimeout(show, timeoutMs)
    }

    return () => {
      cancelled = true
      if (idleId !== null && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId)
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [timeoutMs])

  if (!ready) return null
  return <>{children}</>
}
