"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabaseServer"

export type AddProviderFaqResult = { id: string } | { error: string }

export async function addProviderFaq(
  question: string,
  answer: string
): Promise<AddProviderFaqResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be signed in to add FAQs." }
  }

  const trimmedQuestion = question.trim()
  const trimmedAnswer = answer.trim()

  if (!trimmedQuestion) {
    return { error: "Question is required." }
  }
  if (!trimmedAnswer) {
    return { error: "Answer is required." }
  }

  const { data: existing } = await supabase
    .from("provider_faqs")
    .select("sort_order")
    .eq("provider_profile_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (existing?.sort_order ?? -1) + 1

  const { data: row, error } = await supabase
    .from("provider_faqs")
    .insert({
      provider_profile_id: user.id,
      question: trimmedQuestion,
      answer: trimmedAnswer,
      sort_order: sortOrder,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/provider/faqs")
  revalidatePath("/dashboard/provider")
  revalidatePath("/providers")
  return { id: row.id }
}

export type UpdateProviderFaqResult = { ok: true } | { error: string }

export async function updateProviderFaq(
  id: string,
  question: string,
  answer: string
): Promise<UpdateProviderFaqResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be signed in to update FAQs." }
  }

  const trimmedQuestion = question.trim()
  const trimmedAnswer = answer.trim()

  if (!trimmedQuestion) {
    return { error: "Question is required." }
  }
  if (!trimmedAnswer) {
    return { error: "Answer is required." }
  }

  const { error } = await supabase
    .from("provider_faqs")
    .update({ question: trimmedQuestion, answer: trimmedAnswer })
    .eq("id", id)
    .eq("provider_profile_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/provider/faqs")
  revalidatePath("/dashboard/provider")
  revalidatePath("/providers")
  return { ok: true }
}

export type DeleteProviderFaqResult = { ok: true } | { error: string }

export async function deleteProviderFaq(id: string): Promise<DeleteProviderFaqResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be signed in to delete FAQs." }
  }

  const { error } = await supabase
    .from("provider_faqs")
    .delete()
    .eq("id", id)
    .eq("provider_profile_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/provider/faqs")
  revalidatePath("/dashboard/provider")
  revalidatePath("/providers")
  return { ok: true }
}

export type ReorderProviderFaqsResult = { ok: true } | { error: string }

export async function reorderProviderFaqs(ids: string[]): Promise<ReorderProviderFaqsResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "You must be signed in to reorder FAQs." }
  }

  if (ids.length === 0) {
    return { ok: true }
  }

  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from("provider_faqs")
      .update({ sort_order: i })
      .eq("id", ids[i])
      .eq("provider_profile_id", user.id)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath("/dashboard/provider/faqs")
  revalidatePath("/dashboard/provider")
  revalidatePath("/providers")
  return { ok: true }
}
