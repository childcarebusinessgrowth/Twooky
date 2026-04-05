"use server"

import { revalidatePath } from "next/cache"
import { revalidateDirectoryMetadataCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

type LanguageInput = {
  name: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_LANGUAGES_PATH = "/admin/languages"

export async function createLanguage(input: LanguageInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("languages").insert({
    name: input.name.trim(),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LANGUAGES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function updateLanguage(id: string, input: LanguageInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("languages")
    .update({
      name: input.name.trim(),
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LANGUAGES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function deleteLanguage(id: string) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("languages").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_LANGUAGES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}
