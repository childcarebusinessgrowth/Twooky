import { guardRoleOrRedirect } from "@/lib/authzServer"
import { AdminLayoutClient } from "./admin-layout-client"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await guardRoleOrRedirect("admin")
  return (
    <AdminLayoutClient>{children}</AdminLayoutClient>
  )
}
