import "server-only"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import {
  canAccessAdminPath,
  getAdminPermissionsForRole,
  getProfileRoleForUser,
  hasAdminPermission,
  resolveAdminTeamRoleForUser,
  type AdminPermission,
  type AdminTeamRole,
  type AppRole,
} from "@/lib/authz"

export async function getCurrentUserRole(requiredRole?: AppRole) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { user: null, role: null as AppRole | null }
  }

  const role = await getProfileRoleForUser(supabase, user)
  if (!role) {
    return { user, role: null as AppRole | null }
  }

  if (requiredRole && role !== requiredRole) {
    return { user, role }
  }

  return { user, role }
}

export async function getCurrentAdminAccess() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      user: null,
      role: null as AppRole | null,
      teamRole: null as AdminTeamRole | null,
      permissions: new Set<AdminPermission>(),
    }
  }

  const role = await getProfileRoleForUser(supabase, user)
  if (role !== "admin") {
    return {
      user,
      role,
      teamRole: null as AdminTeamRole | null,
      permissions: new Set<AdminPermission>(),
    }
  }

  const teamRole = await resolveAdminTeamRoleForUser(supabase, user, role)
  const permissions = teamRole ? getAdminPermissionsForRole(teamRole) : new Set<AdminPermission>()

  return { user, role, teamRole, permissions }
}

export async function assertServerRole(requiredRole: AppRole) {
  const { user, role } = await getCurrentUserRole(requiredRole)
  if (!user) {
    throw new Error("Unauthorized")
  }

  if (role !== requiredRole) {
    throw new Error("Forbidden")
  }
}

export async function assertAdminPermission(permission: AdminPermission) {
  const { user, role, teamRole } = await getCurrentAdminAccess()
  if (!user) {
    throw new Error("Unauthorized")
  }
  if (role !== "admin" || !teamRole || !hasAdminPermission(teamRole, permission)) {
    throw new Error("Forbidden")
  }
}

export async function guardRoleOrRedirect(requiredRole: AppRole, loginPath = "/login") {
  const { user, role } = await getCurrentUserRole(requiredRole)

  if (!user) {
    redirect(loginPath)
  }

  if (role !== requiredRole) {
    redirect("/")
  }
}

export async function guardAdminPermissionOrRedirect(permission: AdminPermission, loginPath = "/login") {
  const { user, role, teamRole } = await getCurrentAdminAccess()
  if (!user) {
    redirect(loginPath)
  }
  if (role !== "admin" || !teamRole || !hasAdminPermission(teamRole, permission)) {
    redirect("/admin")
  }
}

export async function guardAdminRouteOrRedirect(loginPath = "/login") {
  const { user, role, teamRole } = await getCurrentAdminAccess()
  if (!user) {
    redirect(loginPath)
  }
  if (role !== "admin") {
    redirect("/admin")
  }
  if (!teamRole) {
    redirect(loginPath)
  }

  const requestHeaders = await headers()
  const pathname =
    requestHeaders.get("x-pathname") ??
    requestHeaders.get("x-nextjs-pathname") ??
    requestHeaders.get("next-url") ??
    "/admin"
  if (!canAccessAdminPath(teamRole, pathname)) {
    redirect("/admin")
  }
}
