"use client"

import { useMemo, useState, useTransition } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createAdminTeamMember,
  deleteTeamMember,
  regenerateTeamMemberPassword,
  setTeamMemberActive,
  updateTeamMemberRole,
  type TeamMemberRow,
} from "./actions"

const roleOptions = [
  { value: "base_user", label: "Base User" },
  { value: "account_manager", label: "Account Manager" },
  { value: "top_admin", label: "Top Admin" },
] as const

const createRoleOptions = [
  { value: "base_user", label: "Base User" },
  { value: "account_manager", label: "Account Manager" },
] as const

const rolePermissionNotes = [
  {
    role: "Base User",
    permissions: [
      "Approve review moderation decisions",
      "Approve badge and verification requests",
    ],
  },
  {
    role: "Account Manager",
    permissions: [
      "Everything in Base User",
      "Manage listings and provider profile updates",
      "Manage sponsors and local deals",
      "Manage parents",
      "Manage blogs",
      "Manage directory settings (locations, curriculum, features, languages, program types, currencies, age groups)",
    ],
  },
  {
    role: "Top Admin",
    permissions: [
      "Everything in Account Manager",
      "Manage Team users (add, role updates, deactivate/activate, delete, regenerate passwords)",
    ],
  },
] as const

function roleLabel(role: TeamMemberRow["teamRole"]): string {
  return roleOptions.find((opt) => opt.value === role)?.label ?? role
}

export function AdminTeamClient({ initialMembers }: { initialMembers: TeamMemberRow[] }) {
  const { toast } = useToast()
  const [members, setMembers] = useState(initialMembers)
  const [createEmail, setCreateEmail] = useState("")
  const [createRole, setCreateRole] = useState<(typeof createRoleOptions)[number]["value"]>("base_user")
  const [createDisplayName, setCreateDisplayName] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        if (a.teamRole === "top_admin" && b.teamRole !== "top_admin") return -1
        if (b.teamRole === "top_admin" && a.teamRole !== "top_admin") return 1
        return a.email.localeCompare(b.email)
      }),
    [members],
  )

  function onCreateMember() {
    setStatus(null)
    startTransition(async () => {
      const result = await createAdminTeamMember({
        email: createEmail,
        teamRole: createRole,
        displayName: createDisplayName,
      })
      if (!result.ok) {
        const message = result.error ?? "Could not create team member."
        setStatus(message)
        toast({
          title: "Could not add team member",
          description: message,
          variant: "destructive",
        })
        return
      }
      if (result.teamMember) {
        setMembers((prev) => {
          const exists = prev.some((member) => member.profileId === result.teamMember?.profileId)
          if (exists) {
            return prev.map((member) => (member.profileId === result.teamMember?.profileId ? result.teamMember : member))
          }
          return [...prev, result.teamMember]
        })
      }

      if (result.emailSent) {
        const message = "New user added and credentials sent by email."
        setStatus(message)
        toast({
          title: "Team member added",
          description: message,
          variant: "success",
        })
      } else {
        const message = "User was added, but credentials email could not be sent."
        setStatus(message)
        toast({
          title: "User added, email failed",
          description: message,
          variant: "destructive",
        })
      }
      setCreateEmail("")
      setCreateDisplayName("")
    })
  }

  function onRegeneratePassword(profileId: string) {
    setStatus(null)
    startTransition(async () => {
      const result = await regenerateTeamMemberPassword(profileId)
      if (!result.ok) {
        const message = result.error ?? "Could not regenerate credentials."
        setStatus(message)
        toast({
          title: "Could not regenerate credentials",
          description: message,
          variant: "destructive",
        })
        return
      }
      if (result.emailSent) {
        const message = "New credentials have been sent by email."
        setStatus(message)
        toast({
          title: "Credentials sent",
          description: message,
          variant: "success",
        })
      } else {
        const message = "Credentials were regenerated, but the email could not be sent."
        setStatus(message)
        toast({
          title: "Email delivery failed",
          description: message,
          variant: "destructive",
        })
      }
    })
  }

  function onRoleChange(profileId: string, teamRole: string) {
    setStatus(null)
    startTransition(async () => {
      const result = await updateTeamMemberRole(profileId, teamRole)
      if (!result.ok) {
        setStatus(result.error ?? "Could not update role.")
        return
      }
      setStatus("Team role updated.")
      setMembers((prev) => prev.map((m) => (m.profileId === profileId ? { ...m, teamRole: teamRole as TeamMemberRow["teamRole"] } : m)))
    })
  }

  function onToggleActive(profileId: string, nextActive: boolean) {
    setStatus(null)
    startTransition(async () => {
      const result = await setTeamMemberActive(profileId, nextActive)
      if (!result.ok) {
        setStatus(result.error ?? "Could not update account status.")
        return
      }
      setStatus(nextActive ? "Account activated." : "Account deactivated.")
      setMembers((prev) => prev.map((m) => (m.profileId === profileId ? { ...m, isActive: nextActive } : m)))
    })
  }

  function onDeleteMember(profileId: string) {
    setStatus(null)
    startTransition(async () => {
      const result = await deleteTeamMember(profileId)
      if (!result.ok) {
        setStatus(result.error ?? "Could not delete team member.")
        return
      }
      setStatus("Team member deleted.")
      setMembers((prev) => prev.filter((m) => m.profileId !== profileId))
    })
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Add Team Member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Email address"
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
            />
            <Input
              placeholder="Display name (optional)"
              value={createDisplayName}
              onChange={(e) => setCreateDisplayName(e.target.value)}
            />
            <Select
              value={createRole}
              onValueChange={(value) => setCreateRole(value as (typeof createRoleOptions)[number]["value"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {createRoleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button disabled={isPending} onClick={onCreateMember}>
              Create user and send credentials
            </Button>
          </div>
        </CardContent>
      </Card>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedMembers.map((member) => (
                <div
                  key={member.profileId}
                  className="rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{member.displayName || member.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant={member.isActive ? "default" : "secondary"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p>
                    <Select
                      value={member.teamRole}
                      onValueChange={(value) => onRoleChange(member.profileId, value)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full" aria-label={`Update role for ${member.email}`}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => onToggleActive(member.profileId, !member.isActive)}
                    >
                      {member.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => onRegeneratePassword(member.profileId)}
                    >
                      Regenerate
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isPending} className="cursor-pointer">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete team member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove {member.email} from authentication and from the Team list.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => onDeleteMember(member.profileId)}
                          >
                            Delete member
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">{roleLabel(member.teamRole)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-muted/20">
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Permission summary for each team role:
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {rolePermissionNotes.map((item) => (
              <div key={item.role} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">{item.role}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {item.permissions.map((permission) => (
                    <li key={permission}>- {permission}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
