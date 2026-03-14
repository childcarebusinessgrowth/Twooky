import type { User } from "@supabase/supabase-js"

type UserRole = "parent" | "provider" | "admin"

type Identity = {
  name: string
  email: string
  initials: string
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function nameFromEmail(email: string): string {
  const [localPart] = email.split("@")
  const words = localPart.split(/[._-]+/).filter(Boolean)
  if (words.length === 0) return "User"
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
}

function getInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length === 0) return "U"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

function roleNameCandidates(role: UserRole, user: User): Array<string | null> {
  const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>

  const common = [
    asNonEmptyString(userMetadata.display_name),
    asNonEmptyString(userMetadata.full_name),
    asNonEmptyString(userMetadata.name),
    asNonEmptyString(appMetadata.display_name),
    asNonEmptyString(appMetadata.full_name),
    asNonEmptyString(appMetadata.name),
  ]

  if (role === "provider") {
    return [
      asNonEmptyString(userMetadata.business_name),
      asNonEmptyString(appMetadata.business_name),
      ...common,
    ]
  }

  return common
}

export function getUserIdentity(user: User | null, role: UserRole): Identity {
  const email = asNonEmptyString(user?.email) ?? "No email"
  const fallbackNameByRole: Record<UserRole, string> = {
    parent: "Parent User",
    provider: "Provider Account",
    admin: "Admin User",
  }

  const resolvedName =
    (user ? roleNameCandidates(role, user).find((candidate) => !!candidate) : null) ??
    (email !== "No email" ? nameFromEmail(email) : fallbackNameByRole[role])

  return {
    name: resolvedName,
    email,
    initials: getInitials(resolvedName),
  }
}
