"use server"

import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { assertAdminPermission, getCurrentAdminAccess } from "@/lib/authzServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { sendAdminTeamCredentialsEmail } from "@/lib/email/adminTeamCredentials"
import type { AdminTeamRole } from "@/lib/authz"

const TEAM_PATH = "/admin/team"

export type TeamMemberRow = {
  profileId: string
  email: string
  displayName: string | null
  teamRole: AdminTeamRole
  isActive: boolean
  createdAt: string
}

export type TeamActionResult = {
  ok: boolean
  error?: string
  emailSent?: boolean
  teamMember?: TeamMemberRow
}

type TeamMemberWithProfileRow = {
  profile_id: string
  team_role: AdminTeamRole
  is_active: boolean
  created_at: string
}

function normalizeRole(value: string): AdminTeamRole | null {
  if (value === "base_user" || value === "account_manager" || value === "top_admin") return value
  return null
}

function roleLabel(role: AdminTeamRole): string {
  if (role === "top_admin") return "Top Admin"
  if (role === "account_manager") return "Account Manager"
  return "Base User"
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

function generatePassword(length = 16): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?"
  const bytes = randomBytes(length)
  let value = ""
  for (let i = 0; i < length; i += 1) {
    value += alphabet[bytes[i] % alphabet.length]
  }
  return value
}

async function ensureTopAdmin() {
  await assertAdminPermission("team.manage")
  return getCurrentAdminAccess()
}

export async function getAdminTeamMembers(): Promise<TeamMemberRow[]> {
  await ensureTopAdmin()
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from("admin_team_members" as never)
    .select("profile_id, team_role, is_active, created_at")
    .order("created_at", { ascending: true })

  if (error || !data) {
    if (error) {
      console.error("[admin-team] failed to load team members", error)
    }
    return []
  }

  const rows = data as unknown as TeamMemberWithProfileRow[]
  const profileIds = rows.map((row) => row.profile_id)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, display_name")
    .in("id", profileIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  return rows.map((row) => {
    const profile = profileMap.get(row.profile_id)
    return {
      profileId: row.profile_id,
      email: profile?.email ?? "",
      displayName: profile?.display_name ?? null,
      teamRole: row.team_role,
      isActive: row.is_active,
      createdAt: row.created_at,
    }
  })
}

export async function createAdminTeamMember(input: {
  email: string
  teamRole: string
  displayName?: string
}): Promise<TeamActionResult> {
  const access = await ensureTopAdmin()
  const actorId = access.user?.id ?? null
  const actorName = access.user?.user_metadata?.full_name ?? access.user?.email ?? "Top Admin"
  const teamRole = normalizeRole(input.teamRole)
  const email = normalizeEmail(input.email)
  const displayName = input.displayName?.trim() || null

  if (!teamRole) return { ok: false, error: "Invalid team role." }
  if (teamRole === "top_admin") {
    return { ok: false, error: "Top Admin creation is temporarily disabled." }
  }
  if (!email || !email.includes("@")) return { ok: false, error: "Please enter a valid email address." }

  const admin = getSupabaseAdminClient()
  const generatedPassword = generatePassword()

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle()

  let targetUserId = existingProfile?.id ?? null
  if (existingProfile && existingProfile.role !== "admin") {
    return { ok: false, error: "This email already belongs to a non-admin account." }
  }

  if (targetUserId) {
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetUserId, {
      password: generatedPassword,
      email_confirm: true,
      app_metadata: { role: "admin" },
      user_metadata: {
        role: "admin",
        ...(displayName ? { display_name: displayName } : {}),
      },
    })
    if (authUpdateError) return { ok: false, error: authUpdateError.message }
  } else {
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      app_metadata: { role: "admin" },
      user_metadata: {
        role: "admin",
        ...(displayName ? { display_name: displayName } : {}),
      },
    })
    if (createError) return { ok: false, error: createError.message }
    targetUserId = createdUser.user?.id ?? null
  }

  if (!targetUserId) return { ok: false, error: "Could not resolve created user id." }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: targetUserId,
      email,
      role: "admin",
      display_name: displayName ?? email,
      is_active: true,
    },
    { onConflict: "id" },
  )
  if (profileError) return { ok: false, error: profileError.message }

  const { error: teamError } = await admin.from("admin_team_members" as never).upsert(
    {
      profile_id: targetUserId,
      team_role: teamRole,
      is_active: true,
      created_by: actorId,
      last_password_generated_at: new Date().toISOString(),
      last_password_generated_by: actorId,
    } as never,
    { onConflict: "profile_id" },
  )
  if (teamError) return { ok: false, error: teamError.message }

  const { data: createdTeamMemberRow } = await admin
    .from("admin_team_members" as never)
    .select("created_at")
    .eq("profile_id", targetUserId)
    .maybeSingle()

  const emailSent = await sendAdminTeamCredentialsEmail({
    email,
    password: generatedPassword,
    roleLabel: roleLabel(teamRole),
    generatedByName: String(actorName),
    isReset: false,
  })

  return {
    ok: true,
    emailSent,
    teamMember: {
      profileId: targetUserId,
      email,
      displayName: displayName ?? email,
      teamRole,
      isActive: true,
      createdAt: (createdTeamMemberRow as { created_at?: string } | null)?.created_at ?? new Date().toISOString(),
    },
  }
}

export async function regenerateTeamMemberPassword(profileId: string): Promise<TeamActionResult> {
  const access = await ensureTopAdmin()
  const actorId = access.user?.id ?? null
  const actorName = access.user?.user_metadata?.full_name ?? access.user?.email ?? "Top Admin"
  if (!profileId) return { ok: false, error: "Missing team member." }

  const admin = getSupabaseAdminClient()
  const { data: member } = await admin
    .from("admin_team_members" as never)
    .select("profile_id, team_role, is_active")
    .eq("profile_id", profileId)
    .maybeSingle()
  if (!member) return { ok: false, error: "Team member not found." }

  const typedMember = member as unknown as TeamMemberWithProfileRow

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle()

  const email = profile?.email?.trim().toLowerCase()
  if (!email) return { ok: false, error: "Team member email is missing." }

  const generatedPassword = generatePassword()
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(profileId, {
    password: generatedPassword,
  })
  if (authUpdateError) return { ok: false, error: authUpdateError.message }

  await admin
    .from("admin_team_members" as never)
    .update({
      last_password_generated_at: new Date().toISOString(),
      last_password_generated_by: actorId,
    } as never)
    .eq("profile_id", profileId)

  const emailSent = await sendAdminTeamCredentialsEmail({
    email,
    password: generatedPassword,
    roleLabel: roleLabel(typedMember.team_role),
    generatedByName: String(actorName),
    isReset: true,
  })

  return { ok: true, emailSent }
}

export async function updateTeamMemberRole(profileId: string, teamRole: string): Promise<TeamActionResult> {
  const access = await ensureTopAdmin()
  const actorId = access.user?.id ?? null
  const normalizedRole = normalizeRole(teamRole)
  if (!profileId || !normalizedRole) return { ok: false, error: "Invalid role update request." }

  const admin = getSupabaseAdminClient()
  if (profileId === actorId && normalizedRole !== "top_admin") {
    return { ok: false, error: "You cannot remove your own Top Admin role." }
  }

  const { error } = await admin
    .from("admin_team_members" as never)
    .update({ team_role: normalizedRole, is_active: true } as never)
    .eq("profile_id", profileId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(TEAM_PATH)
  return { ok: true }
}

export async function setTeamMemberActive(profileId: string, isActive: boolean): Promise<TeamActionResult> {
  const access = await ensureTopAdmin()
  const actorId = access.user?.id ?? null
  if (!profileId) return { ok: false, error: "Missing team member." }
  if (profileId === actorId && !isActive) {
    return { ok: false, error: "You cannot deactivate your own account." }
  }

  const admin = getSupabaseAdminClient()
  const { error: teamError } = await admin
    .from("admin_team_members" as never)
    .update({ is_active: isActive } as never)
    .eq("profile_id", profileId)
  if (teamError) return { ok: false, error: teamError.message }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId)
    .eq("role", "admin")
  if (profileError) return { ok: false, error: profileError.message }

  revalidatePath(TEAM_PATH)
  return { ok: true }
}

export async function deleteTeamMember(profileId: string): Promise<TeamActionResult> {
  const access = await ensureTopAdmin()
  const actorId = access.user?.id ?? null
  if (!profileId) return { ok: false, error: "Missing team member." }
  if (profileId === actorId) {
    return { ok: false, error: "You cannot delete your own account." }
  }

  const admin = getSupabaseAdminClient()
  const { data: member } = await admin
    .from("admin_team_members" as never)
    .select("profile_id, team_role, is_active")
    .eq("profile_id", profileId)
    .maybeSingle()

  if (!member) return { ok: false, error: "Team member not found." }
  const typedMember = member as unknown as TeamMemberWithProfileRow

  if (typedMember.team_role === "top_admin" && typedMember.is_active) {
    const { count, error: topAdminCountError } = await admin
      .from("admin_team_members")
      .select("profile_id", { count: "exact", head: true })
      .eq("team_role", "top_admin")
      .eq("is_active", true)
    if (topAdminCountError) return { ok: false, error: topAdminCountError.message }
    if ((count ?? 0) <= 1) {
      return { ok: false, error: "You cannot delete the last active Top Admin." }
    }
  }

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(profileId)
  if (deleteUserError) return { ok: false, error: deleteUserError.message }

  revalidatePath(TEAM_PATH)
  return { ok: true }
}
