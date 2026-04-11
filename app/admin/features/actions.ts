"use server"

import { revalidatePath } from "next/cache"
import { revalidateDirectoryMetadataCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertAdminPermission } from "@/lib/authzServer"

type FeatureInput = {
  name: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_FEATURES_PATH = "/admin/features"

export async function createFeature(input: FeatureInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    name: input.name.trim(),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
  const { error } = await supabase.from("provider_features").insert(values)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_FEATURES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function updateFeature(id: string, input: FeatureInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    name: input.name.trim(),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
  const { error } = await supabase
    .from("provider_features")
    .update(values)
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_FEATURES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function deleteFeature(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("provider_features").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_FEATURES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}
