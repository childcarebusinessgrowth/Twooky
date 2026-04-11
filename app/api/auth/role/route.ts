import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getAdminPermissionsForRole, getDefaultRouteForRole, resolveAdminTeamRoleForUser, resolveRoleForUser } from "@/lib/authz"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roleResolution = await resolveRoleForUser(supabase, user)
    const role = roleResolution.role

    if (!role) {
      console.warn("[auth/role] unresolved user role", {
        userId: user.id,
        reason: roleResolution.reason,
        source: roleResolution.source,
        profileErrorMessage: roleResolution.profileErrorMessage,
      })

      return NextResponse.json(
        {
          error: "Role is not configured for this account.",
          unresolvedRole: true,
          reason: roleResolution.reason,
          source: roleResolution.source,
        },
        { status: 409 },
      )
    }

    const adminTeamRole =
      role === "admin"
        ? await resolveAdminTeamRoleForUser(supabase, user, role)
        : null

    const adminPermissions = adminTeamRole ? Array.from(getAdminPermissionsForRole(adminTeamRole)) : []

    return NextResponse.json({
      role,
      source: roleResolution.source,
      adminTeamRole,
      adminPermissions,
      redirectPath: getDefaultRouteForRole(role),
    })
  } catch {
    return NextResponse.json({ error: "Unable to resolve current role" }, { status: 500 })
  }
}
