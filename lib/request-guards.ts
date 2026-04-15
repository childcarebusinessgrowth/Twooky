import { NextResponse } from "next/server"

type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
  errorMessage?: string
}

type RateLimitBucket = {
  count: number
  resetAt: number
}

declare global {
  var __eldRateLimitStore: Map<string, RateLimitBucket> | undefined
}

const rateLimitStore = globalThis.__eldRateLimitStore ?? new Map<string, RateLimitBucket>()

if (!globalThis.__eldRateLimitStore) {
  globalThis.__eldRateLimitStore = rateLimitStore
}

function normalizeHost(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase()
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  return "unknown"
}

function cleanupExpiredRateLimitBuckets(now: number) {
  if (rateLimitStore.size < 500) return

  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key)
    }
  }
}

export function enforceRateLimit(
  request: Request,
  { key, limit, windowMs, errorMessage = "Too many requests. Please try again later." }: RateLimitOptions,
): NextResponse | null {
  const now = Date.now()
  cleanupExpiredRateLimitBuckets(now)

  const bucketKey = `${key}:${getClientIp(request)}`
  const existing = rateLimitStore.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs,
    })
    return null
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return NextResponse.json(
      { error: errorMessage },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    )
  }

  existing.count += 1
  rateLimitStore.set(bucketKey, existing)
  return null
}

export function enforceTrustedOrigin(
  request: Request,
  options: { allowRootSubdomains?: boolean } = {},
): NextResponse | null {
  const originHeader = request.headers.get("origin")?.trim()
  if (!originHeader) return null

  let origin: URL
  try {
    origin = new URL(originHeader)
  } catch {
    return NextResponse.json({ error: "Invalid origin." }, { status: 400 })
  }

  const originHost = normalizeHost(origin.host)
  const requestHost = normalizeHost(request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
  const siteHost = (() => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    if (!siteUrl) return ""
    try {
      return normalizeHost(new URL(siteUrl).host)
    } catch {
      return ""
    }
  })()

  if (originHost && (originHost === requestHost || originHost === siteHost)) {
    return null
  }

  if (options.allowRootSubdomains) {
    const rootDomain = normalizeHost(process.env.NEXT_PUBLIC_SITE_ROOT_DOMAIN)
    const originHostname = normalizeHost(origin.hostname)
    if (
      rootDomain &&
      (originHostname === rootDomain ||
        originHostname === `www.${rootDomain}` ||
        originHostname.endsWith(`.${rootDomain}`))
    ) {
      return null
    }
  }

  return NextResponse.json({ error: "Untrusted request origin." }, { status: 403 })
}
