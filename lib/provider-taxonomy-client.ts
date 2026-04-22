"use client"

const PROVIDER_TAXONOMY_REFRESH_EVENT = "eld:provider-taxonomy-refreshed"
const PROVIDER_TAXONOMY_REFRESH_CHANNEL = "eld:provider-taxonomy"

type ProviderTaxonomyRefreshListener = () => void

export function dispatchProviderTaxonomyRefresh(): void {
  if (typeof window === "undefined") return

  window.dispatchEvent(new Event(PROVIDER_TAXONOMY_REFRESH_EVENT))

  if (!("BroadcastChannel" in window)) return

  const channel = new BroadcastChannel(PROVIDER_TAXONOMY_REFRESH_CHANNEL)
  channel.postMessage({ type: PROVIDER_TAXONOMY_REFRESH_EVENT, timestamp: Date.now() })
  channel.close()
}

export function subscribeToProviderTaxonomyRefresh(
  listener: ProviderTaxonomyRefreshListener,
): () => void {
  if (typeof window === "undefined") return () => {}

  const handleEvent = () => listener()

  window.addEventListener(PROVIDER_TAXONOMY_REFRESH_EVENT, handleEvent)

  let channel: BroadcastChannel | null = null
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(PROVIDER_TAXONOMY_REFRESH_CHANNEL)
    channel.onmessage = handleEvent
  }

  return () => {
    window.removeEventListener(PROVIDER_TAXONOMY_REFRESH_EVENT, handleEvent)
    channel?.close()
  }
}
