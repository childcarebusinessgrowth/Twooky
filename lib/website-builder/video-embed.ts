const ALLOWED_EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "www.youtu.be",
  "player.vimeo.com",
  "vimeo.com",
  "www.vimeo.com",
])

export function isAllowedEmbedUrl(raw: string): boolean {
  const s = raw.trim()
  if (!s) return false
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`)
    return ALLOWED_EMBED_HOSTS.has(u.hostname.toLowerCase())
  } catch {
    return false
  }
}

/** Normalizes YouTube/Vimeo URLs to iframe `src`; returns null if empty or not allowed. */
export function resolveVideoEmbedUrl(raw: string): string | null {
  const url = raw?.trim()
  if (!url || !isAllowedEmbedUrl(url)) return null
  let embed = url
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`)
    if (u.hostname.includes("youtu")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop()
      if (id) embed = `https://www.youtube.com/embed/${id}`
    } else if (u.hostname.includes("vimeo")) {
      const id = u.pathname.split("/").filter(Boolean).pop()
      if (id) embed = `https://player.vimeo.com/video/${id}`
    }
  } catch {
    return null
  }
  return embed
}
