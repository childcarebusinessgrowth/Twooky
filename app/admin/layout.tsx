import { getCurrentAdminAccess, guardAdminRouteOrRedirect, guardRoleOrRedirect } from "@/lib/authzServer"
import { AdminLayoutClient } from "./admin-layout-client"
import { getPendingClaimsCount } from "./claims/actions"
import { AuthProviderClient } from "@/components/auth-provider-client"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await guardRoleOrRedirect("admin")
  await guardAdminRouteOrRedirect()
  const access = await getCurrentAdminAccess()
  const pendingClaimsCount = access.permissions.has("badges.verify") ? await getPendingClaimsCount() : 0
  return (
    <AuthProviderClient>
      <AdminLayoutClient
        pendingClaimsCount={pendingClaimsCount}
        teamRole={access.teamRole}
        permissions={[...access.permissions]}
        canManageTeam={access.permissions.has("team.manage")}
      >
        {children}
      </AdminLayoutClient>
    </AuthProviderClient>
  )
}
