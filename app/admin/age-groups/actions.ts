"use server"

import { revalidatePath } from "next/cache"
import { revalidateDirectoryMetadataCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

type AgeGroupInput = {
  name: string
  ageRange?: string | null
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_AGE_GROUPS_PATH = "/admin/age-groups"

export async function createAgeGroup(input: AgeGroupInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("age_groups").insert({
    name: input.name.trim(),
    age_range: input.ageRange?.trim() || null,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_AGE_GROUPS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function updateAgeGroup(id: string, input: AgeGroupInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("age_groups")
    .update({
      name: input.name.trim(),
      age_range: input.ageRange?.trim() || null,
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_AGE_GROUPS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function deleteAgeGroup(id: string) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("age_groups").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_AGE_GROUPS_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}
