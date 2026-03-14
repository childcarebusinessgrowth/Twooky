import type { SupabaseClient, User } from "@supabase/supabase-js"

export type AppRole = "parent" | "provider" | "admin"
export type RoleResolutionSource = "profile" | "metadata" | null
export type RoleResolutionReason = "profile_query_error" | "profile_role_missing_or_invalid" | "missing_role"
export type RoleResolutionResult = {
  role: AppRole | null
  source: RoleResolutionSource
  reason?: RoleResolutionReason
  profileErrorMessage?: string
}

const roleRedirects: Record<AppRole, string> = {
  admin: "/admin",
  provider: "/dashboard/provider",
  parent: "/dashboard/parent",
}

export function isAppRole(value: unknown): value is AppRole {
  return value === "parent" || value === "provider" || value === "admin"
}

export function getDefaultRouteForRole(role: AppRole): string {
  return roleRedirects[role]
}

export function getRequiredRoleForPath(pathname: string): AppRole | null {
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/dashboard/provider")) return "provider"
  if (pathname.startsWith("/dashboard/parent")) return "parent"
  return null
}

export async function resolveRoleForUser(supabase: SupabaseClient, user: User): Promise<RoleResolutionResult> {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

  if (!error && isAppRole(data?.role)) {
    return { role: data.role, source: "profile" }
  }

  // Fallback to auth metadata when profile role isn't currently resolvable.
  const metadataRole = user.app_metadata?.role ?? user.user_metadata?.role
  if (isAppRole(metadataRole)) {
    return {
      role: metadataRole,
      source: "metadata",
      reason: error ? "profile_query_error" : "profile_role_missing_or_invalid",
      profileErrorMessage: error?.message,
    }
  }

  if (error) {
    return {
      role: null,
      source: null,
      reason: "profile_query_error",
      profileErrorMessage: error.message,
    }
  }

  return {
    role: null,
    source: null,
    reason: "missing_role",
  }
}

export async function getProfileRoleForUser(supabase: SupabaseClient, user: User): Promise<AppRole | null> {
  const result = await resolveRoleForUser(supabase, user)
  return result.role
}
