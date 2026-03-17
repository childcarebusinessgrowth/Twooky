"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertServerRole } from "@/lib/authzServer"

type CurrencyInput = {
  code: string
  name: string
  symbol: string
  sortOrder?: number
  isActive?: boolean
}

const ADMIN_CURRENCIES_PATH = "/admin/currencies"

export async function createCurrency(input: CurrencyInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("currencies").insert({
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    symbol: input.symbol.trim(),
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRENCIES_PATH)
  revalidatePath("/admin/directory")
}

export async function updateCurrency(id: string, input: CurrencyInput) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase
    .from("currencies")
    .update({
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      symbol: input.symbol.trim(),
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRENCIES_PATH)
  revalidatePath("/admin/directory")
}

export async function deleteCurrency(id: string) {
  await assertServerRole("admin")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("currencies").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_CURRENCIES_PATH)
  revalidatePath("/admin/directory")
}
