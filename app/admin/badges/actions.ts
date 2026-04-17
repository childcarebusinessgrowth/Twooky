"use server"

import { revalidatePath } from "next/cache"
import { assertAdminPermission } from "@/lib/authzServer"
import {
  DIRECTORY_BADGE_COLORS,
  DIRECTORY_BADGE_ICONS,
  normalizeDirectoryBadgeColor,
  normalizeDirectoryBadgeIcon,
} from "@/lib/directory-badges"
import { revalidateProviderDirectoryCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

type BadgeInput = {
  name: string
  description: string
  color: string
  icon: string
  isActive?: boolean
}

const ADMIN_BADGES_PATH = "/admin/badges"

function assertBadgeInput(input: BadgeInput) {
  if (!input.name.trim()) {
    throw new Error("Badge name is required.")
  }
  if (!input.description.trim()) {
    throw new Error("Badge description is required.")
  }
  if (!DIRECTORY_BADGE_COLORS.includes(input.color as (typeof DIRECTORY_BADGE_COLORS)[number])) {
    throw new Error("Please select a valid badge color.")
  }
  if (!Object.hasOwn(DIRECTORY_BADGE_ICONS, input.icon)) {
    throw new Error("Please select a valid badge icon.")
  }
}

function revalidateBadgePaths() {
  revalidatePath(ADMIN_BADGES_PATH)
  revalidatePath("/admin/directory")
  revalidatePath("/admin/listings")
  revalidateProviderDirectoryCaches()
}

export async function createDirectoryBadge(input: BadgeInput) {
  await assertAdminPermission("directory.manage")
  assertBadgeInput(input)

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("directory_badges").insert({
    name: input.name.trim(),
    description: input.description.trim(),
    color: normalizeDirectoryBadgeColor(input.color),
    icon: normalizeDirectoryBadgeIcon(input.icon),
    is_active: input.isActive ?? true,
  })
  if (error) {
    throw new Error(error.message)
  }

  revalidateBadgePaths()
}

export async function updateDirectoryBadge(id: string, input: BadgeInput) {
  await assertAdminPermission("directory.manage")
  assertBadgeInput(input)

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("directory_badges")
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      color: normalizeDirectoryBadgeColor(input.color),
      icon: normalizeDirectoryBadgeIcon(input.icon),
      is_active: input.isActive ?? true,
    })
    .eq("id", id)
  if (error) {
    throw new Error(error.message)
  }

  revalidateBadgePaths()
}

export async function deleteDirectoryBadge(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("directory_badges").delete().eq("id", id)
  if (error) {
    throw new Error(error.message)
  }

  revalidateBadgePaths()
}
