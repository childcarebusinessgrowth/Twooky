"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

type CurriculumInput = {
  name: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_CURRICULUM_PATH = "/admin/curriculum"

export async function createCurriculum(input: CurriculumInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("curriculum_philosophies").insert({
    name: input.name.trim(),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRICULUM_PATH)
}

export async function updateCurriculum(id: string, input: CurriculumInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("curriculum_philosophies")
    .update({
      name: input.name.trim(),
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRICULUM_PATH)
}

export async function deleteCurriculum(id: string) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("curriculum_philosophies").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRICULUM_PATH)
}
