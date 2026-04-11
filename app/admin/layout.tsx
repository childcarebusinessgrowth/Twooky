import { getCurrentAdminAccess, guardRoleOrRedirect } from "@/lib/authzServer"
import { AdminLayoutClient } from "./admin-layout-client"
import { getPendingClaimsCount } from "./claims/actions"
import { AuthProviderClient } from "@/components/auth-provider-client"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await guardRoleOrRedirect("admin")
  const access = await getCurrentAdminAccess()
  const pendingClaimsCount = await getPendingClaimsCount()
  return (
    <AuthProviderClient>
      <AdminLayoutClient
        pendingClaimsCount={pendingClaimsCount}
        canManageTeam={access.permissions.has("team.manage")}
      >
        {children}
      </AdminLayoutClient>
    </AuthProviderClient>
  )
}
