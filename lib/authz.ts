import type { SupabaseClient, User } from "@supabase/supabase-js"

export type AppRole = "parent" | "provider" | "admin"
export type AdminTeamRole = "base_user" | "account_manager" | "top_admin"
export type AdminPermission =
  | "dashboard.view"
  | "reviews.approve"
  | "badges.verify"
  | "listings.manage"
  | "sponsors.manage"
  | "social-proof.manage"
  | "parents.manage"
  | "blogs.manage"
  | "directory.manage"
  | "team.manage"
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

export function isAdminTeamRole(value: unknown): value is AdminTeamRole {
  return value === "base_user" || value === "account_manager" || value === "top_admin"
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

  if (error) {
    // Preserve metadata fallback for transient query failures so valid users do not
    // get stranded when the profile lookup has a temporary issue.
    const metadataRole = user.app_metadata?.role ?? user.user_metadata?.role
    if (isAppRole(metadataRole)) {
      return {
        role: metadataRole,
        source: "metadata",
        reason: "profile_query_error",
        profileErrorMessage: error.message,
      }
    }

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
    reason: "profile_role_missing_or_invalid",
  }
}

export async function getProfileRoleForUser(supabase: SupabaseClient, user: User): Promise<AppRole | null> {
  const result = await resolveRoleForUser(supabase, user)
  return result.role
}

export function getAdminPermissionsForRole(role: AdminTeamRole): ReadonlySet<AdminPermission> {
  if (role === "top_admin") {
    return new Set<AdminPermission>([
      "dashboard.view",
      "reviews.approve",
      "badges.verify",
      "listings.manage",
      "sponsors.manage",
      "social-proof.manage",
      "parents.manage",
      "blogs.manage",
      "directory.manage",
      "team.manage",
    ])
  }

  if (role === "account_manager") {
    return new Set<AdminPermission>([
      "dashboard.view",
      "reviews.approve",
      "badges.verify",
      "listings.manage",
      "sponsors.manage",
      "social-proof.manage",
      "parents.manage",
      "blogs.manage",
      "directory.manage",
    ])
  }

  return new Set<AdminPermission>(["dashboard.view", "listings.manage"])
}

export function hasAdminPermission(role: AdminTeamRole, permission: AdminPermission): boolean {
  return getAdminPermissionsForRole(role).has(permission)
}

type AdminRoutePermissionRule = {
  prefix: string
  permission: AdminPermission
}

const ADMIN_ROUTE_PERMISSION_RULES: AdminRoutePermissionRule[] = [
  { prefix: "/admin/team", permission: "team.manage" },
  { prefix: "/admin/analytics", permission: "listings.manage" },
  { prefix: "/admin/listings", permission: "listings.manage" },
  { prefix: "/admin/provider-plans", permission: "listings.manage" },
  { prefix: "/admin/parents", permission: "parents.manage" },
  { prefix: "/admin/blogs", permission: "blogs.manage" },
  { prefix: "/admin/sponsors", permission: "sponsors.manage" },
  { prefix: "/admin/contact-messages", permission: "sponsors.manage" },
  { prefix: "/admin/reviews", permission: "reviews.approve" },
  { prefix: "/admin/social-proof", permission: "social-proof.manage" },
  { prefix: "/admin/claims", permission: "badges.verify" },
  { prefix: "/admin/directory", permission: "directory.manage" },
  { prefix: "/admin/features", permission: "directory.manage" },
  { prefix: "/admin/badges", permission: "directory.manage" },
  { prefix: "/admin/age-groups", permission: "directory.manage" },
  { prefix: "/admin/curriculum", permission: "directory.manage" },
  { prefix: "/admin/currencies", permission: "directory.manage" },
  { prefix: "/admin/languages", permission: "directory.manage" },
  { prefix: "/admin/locations", permission: "directory.manage" },
  { prefix: "/admin/program-types", permission: "directory.manage" },
]

export function getRequiredAdminPermissionForPath(pathname: string): AdminPermission | null {
  if (pathname === "/admin") return "dashboard.view"

  const matchedRule = ADMIN_ROUTE_PERMISSION_RULES.find((rule) => pathname.startsWith(rule.prefix))
  return matchedRule?.permission ?? null
}

export function canAccessAdminPath(role: AdminTeamRole, pathname: string): boolean {
  if (role === "base_user") {
    return pathname === "/admin" || pathname.startsWith("/admin/listings")
  }

  const requiredPermission = getRequiredAdminPermissionForPath(pathname)
  if (!requiredPermission) return false
  return hasAdminPermission(role, requiredPermission)
}

export async function resolveAdminTeamRoleForUser(
  supabase: SupabaseClient,
  user: User,
  role: AppRole | null,
): Promise<AdminTeamRole | null> {
  if (role !== "admin") return null

  const { data, error } = await supabase
    .from("admin_team_members")
    .select("team_role, is_active")
    .eq("profile_id", user.id)
    .maybeSingle()

  // Legacy fallback keeps existing admins functional before they are explicitly managed in Team tab.
  if (error || !data) return "top_admin"
  if (!data.is_active) return null
  return isAdminTeamRole(data.team_role) ? data.team_role : "top_admin"
}
