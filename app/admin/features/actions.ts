"use server"

import { revalidatePath } from "next/cache"
import { revalidateDirectoryMetadataCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

type FeatureInput = {
  name: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_FEATURES_PATH = "/admin/features"

export async function createFeature(input: FeatureInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("provider_features").insert({
    name: input.name.trim(),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_FEATURES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function updateFeature(id: string, input: FeatureInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("provider_features")
    .update({
      name: input.name.trim(),
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_FEATURES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function deleteFeature(id: string) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("provider_features").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_FEATURES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}
