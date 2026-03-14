type ParsedYouTubeUrl = {
  videoId: string
  normalizedUrl: string
  embedUrl: string
}

const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

function coerceUrl(value: string): URL | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    return new URL(trimmed)
  } catch {
    try {
      return new URL(`https://${trimmed}`)
    } catch {
      return null
    }
  }
}

function extractVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^www\./, "")

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0]
    return id && YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v")
      return id && YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null
    }

    const segments = url.pathname.split("/").filter(Boolean)
    if (segments.length >= 2 && ["embed", "shorts", "live"].includes(segments[0])) {
      const id = segments[1]
      return YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null
    }
  }

  return null
}

export function parseYouTubeUrl(value: string): ParsedYouTubeUrl | null {
  const url = coerceUrl(value)
  if (!url) return null

  const videoId = extractVideoId(url)
  if (!videoId) return null

  return {
    videoId,
    normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  }
}

