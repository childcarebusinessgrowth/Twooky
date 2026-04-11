"use server"

import { revalidatePath } from "next/cache"
import { revalidateDirectoryMetadataCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertAdminPermission } from "@/lib/authzServer"

type LanguageInput = {
  name: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_LANGUAGES_PATH = "/admin/languages"

export async function createLanguage(input: LanguageInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    name: input.name.trim(),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
  const { error } = await supabase.from("languages").insert(values)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LANGUAGES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function updateLanguage(id: string, input: LanguageInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    name: input.name.trim(),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
  const { error } = await supabase
    .from("languages")
    .update(values)
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LANGUAGES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function deleteLanguage(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("languages").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LANGUAGES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}
