"use server"

import { revalidatePath } from "next/cache"
import { revalidateDirectoryMetadataCaches } from "@/lib/revalidate-public-directory"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { assertAdminPermission } from "@/lib/authzServer"

type FaqInput = {
  question: string
  answer: string
  sortOrder?: number
}

type ProgramTypeInput = {
  name: string
  sortOrder?: number
  isActive?: boolean
  aboutText?: string | null
  shortDescription?: string | null
  ageGroupIds?: string[]
  keyBenefits?: string[]
  faqs?: FaqInput[]
}

const ADMIN_PROGRAM_TYPES_PATH = "/admin/program-types"
const ADMIN_DIRECTORY_PATH = "/admin/directory"

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function getProgramTypeWithDetails(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()

  const { data: programType, error: ptError } = await supabase
    .from("program_types")
    .select("id, name, sort_order, is_active, about_text, key_benefits, short_description, age_group_ids, slug")
    .eq("id", id)
    .single()

  if (ptError || !programType) {
    return null
  }

  const { data: faqs } = await supabase
    .from("program_type_faqs")
    .select("id, question, answer, sort_order")
    .eq("program_type_id", id)
    .order("sort_order", { ascending: true })

  return {
    ...programType,
    faqs: faqs ?? [],
  }
}

export async function createProgramType(input: ProgramTypeInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const slug = slugFromName(input.name.trim())
  const values = {
    name: input.name.trim(),
    is_active: input.isActive ?? true,
    about_text: input.aboutText?.trim() || null,
    short_description: input.shortDescription?.trim() || null,
    age_group_ids: input.ageGroupIds?.length ? input.ageGroupIds : [],
    key_benefits: input.keyBenefits?.filter(Boolean) ?? [],
    slug: slug || null,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }

  const { data: inserted, error } = await supabase
    .from("program_types")
    .insert(values)
    .select("id")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (inserted && input.faqs?.length) {
    const faqRows = input.faqs
      .filter((f) => f.question.trim() || f.answer.trim())
      .map((f, i) => ({
        program_type_id: inserted.id,
        question: f.question.trim(),
        answer: f.answer.trim(),
        sort_order: f.sortOrder ?? i,
      }))
    if (faqRows.length) {
      await supabase.from("program_type_faqs").insert(faqRows)
    }
  }

  revalidatePath(ADMIN_PROGRAM_TYPES_PATH)
  revalidatePath(ADMIN_DIRECTORY_PATH)
  revalidateDirectoryMetadataCaches()
}

export async function updateProgramType(id: string, input: ProgramTypeInput) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const slug = slugFromName(input.name.trim())
  const values = {
    name: input.name.trim(),
    is_active: input.isActive ?? true,
    about_text: input.aboutText?.trim() || null,
    short_description: input.shortDescription?.trim() || null,
    age_group_ids: input.ageGroupIds?.length ? input.ageGroupIds : [],
    key_benefits: input.keyBenefits?.filter(Boolean) ?? [],
    slug: slug || null,
    ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
  }

  const { error } = await supabase
    .from("program_types")
    .update(values)
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  await supabase.from("program_type_faqs").delete().eq("program_type_id", id)

  if (input.faqs?.length) {
    const faqRows = input.faqs
      .filter((f) => f.question.trim() || f.answer.trim())
      .map((f, i) => ({
        program_type_id: id,
        question: f.question.trim(),
        answer: f.answer.trim(),
        sort_order: f.sortOrder ?? i,
      }))
    if (faqRows.length) {
      await supabase.from("program_type_faqs").insert(faqRows)
    }
  }

  revalidatePath(ADMIN_PROGRAM_TYPES_PATH)
  revalidatePath(ADMIN_DIRECTORY_PATH)
  revalidateDirectoryMetadataCaches()
}

export async function deleteProgramType(id: string) {
  await assertAdminPermission("directory.manage")
  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("program_types").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(ADMIN_PROGRAM_TYPES_PATH)
  revalidatePath(ADMIN_DIRECTORY_PATH)
  revalidateDirectoryMetadataCaches()
}
