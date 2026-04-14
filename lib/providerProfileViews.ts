export const PROVIDER_PROFILE_VISITOR_COOKIE_NAME = "eld_provider_profile_visitor"
export const PROVIDER_PROFILE_VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export function isLikelyVisitorToken(value: string | undefined): value is string {
  if (!value) return false
  return /^[A-Za-z0-9_-]{8,128}$/.test(value)
}

export function formatUtcDateBucket(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}
