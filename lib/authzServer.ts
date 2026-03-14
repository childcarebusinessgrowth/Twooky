import "server-only"

import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getProfileRoleForUser, type AppRole } from "@/lib/authz"

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

export async function assertServerRole(requiredRole: AppRole) {
  const { user, role } = await getCurrentUserRole(requiredRole)
  if (!user) {
    throw new Error("Unauthorized")
  }

  if (role !== requiredRole) {
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
