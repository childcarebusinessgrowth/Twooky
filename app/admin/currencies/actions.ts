"use server"

import { revalidatePath } from "next/cache"
import { revalidateDirectoryMetadataCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertAdminPermission } from "@/lib/authzServer"

type CurrencyInput = {
  code: string
  name: string
  symbol: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_CURRENCIES_PATH = "/admin/currencies"

export async function createCurrency(input: CurrencyInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    symbol: input.symbol.trim(),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
  const { error } = await supabase.from("currencies").insert(values)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRENCIES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function updateCurrency(id: string, input: CurrencyInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const values = {
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    symbol: input.symbol.trim(),
    is_active: input.isActive ?? true,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }
  const { error } = await supabase
    .from("currencies")
    .update(values)
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRENCIES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}

export async function deleteCurrency(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("currencies").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRENCIES_PATH)
  revalidatePath("/admin/directory")
  revalidateDirectoryMetadataCaches()
}
