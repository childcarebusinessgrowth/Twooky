import { guardRoleOrRedirect } from "@/lib/authzServer"
import { AdminLayoutClient } from "./admin-layout-client"
import { getPendingClaimsCount } from "./claims/actions"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await guardRoleOrRedirect("admin")
  const pendingClaimsCount = await getPendingClaimsCount()
  return (
    <AdminLayoutClient pendingClaimsCount={pendingClaimsCount}>
      {children}
    </AdminLayoutClient>
  )
}
