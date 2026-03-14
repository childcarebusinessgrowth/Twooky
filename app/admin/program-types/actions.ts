"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

type ProgramTypeInput = {
  name: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_PROGRAM_TYPES_PATH = "/admin/program-types"

export async function createProgramType(input: ProgramTypeInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("program_types").insert({
    name: input.name.trim(),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_PROGRAM_TYPES_PATH)
}

export async function updateProgramType(id: string, input: ProgramTypeInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("program_types")
    .update({
      name: input.name.trim(),
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_PROGRAM_TYPES_PATH)
}

export async function deleteProgramType(id: string) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("program_types").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_PROGRAM_TYPES_PATH)
}
