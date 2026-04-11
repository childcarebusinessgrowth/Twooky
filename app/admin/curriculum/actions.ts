"use server"

import { revalidatePath } from "next/cache"
import { revalidateDirectoryMetadataCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertAdminPermission } from "@/lib/authzServer"

type CurriculumInput = {
  name: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_CURRICULUM_PATH = "/admin/curriculum"

export async function createCurriculum(input: CurriculumInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    name: input.name.trim(),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
  const { error } = await supabase.from("curriculum_philosophies").insert(values)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRICULUM_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function updateCurriculum(id: string, input: CurriculumInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    name: input.name.trim(),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
  const { error } = await supabase
    .from("curriculum_philosophies")
    .update(values)
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRICULUM_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function deleteCurriculum(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("curriculum_philosophies").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRICULUM_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}
