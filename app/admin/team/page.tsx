import { guardAdminPermissionOrRedirect } from "@/lib/authzServer"
import { getAdminTeamMembers } from "./actions"
import { AdminTeamClient } from "./team-client"

export default async function AdminTeamPage() {
  await guardAdminPermissionOrRedirect("team.manage")
  const members = await getAdminTeamMembers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="text-muted-foreground">
          Manage admin team users, role levels, and password regeneration.
        </p>
      </div>
      <AdminTeamClient initialMembers={members} />
    </div>
  )
}
