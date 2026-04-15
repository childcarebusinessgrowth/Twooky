"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"

async function revalidateProviderPublicProfileForFaqs(profileId: string) {
  const admin = getSupabaseAdminClient()
  const { data } = await admin
    .from("provider_profiles")
    .select("provider_slug")
    .eq("profile_id", profileId)
    .maybeSingle()
  if (data?.provider_slug) {
    revalidatePath(`/providers/${data.provider_slug}`)
  }
}

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
  const { providerProfileId, canAccessFaqs } = await getProviderPlanAccessForUser(supabase, user.id)
  if (!canAccessFaqs) {
    return { error: "FAQs are not available on the Sprout plan." }
  }

  const { data: existing } = await supabase
    .from("provider_faqs")
    .select("sort_order")
    .eq("provider_profile_id", providerProfileId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (existing?.sort_order ?? -1) + 1

  const { data: row, error } = await supabase
    .from("provider_faqs")
    .insert({
      provider_profile_id: providerProfileId,
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
  await revalidateProviderPublicProfileForFaqs(providerProfileId)
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
  const { providerProfileId, canAccessFaqs } = await getProviderPlanAccessForUser(supabase, user.id)
  if (!canAccessFaqs) {
    return { error: "FAQs are not available on the Sprout plan." }
  }

  const { error } = await supabase
    .from("provider_faqs")
    .update({ question: trimmedQuestion, answer: trimmedAnswer })
    .eq("id", id)
    .eq("provider_profile_id", providerProfileId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/provider/faqs")
  revalidatePath("/dashboard/provider")
  await revalidateProviderPublicProfileForFaqs(providerProfileId)
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
  const { providerProfileId, canAccessFaqs } = await getProviderPlanAccessForUser(supabase, user.id)
  if (!canAccessFaqs) {
    return { error: "FAQs are not available on the Sprout plan." }
  }

  const { error } = await supabase
    .from("provider_faqs")
    .delete()
    .eq("id", id)
    .eq("provider_profile_id", providerProfileId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/provider/faqs")
  revalidatePath("/dashboard/provider")
  await revalidateProviderPublicProfileForFaqs(providerProfileId)
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
  const { providerProfileId, canAccessFaqs } = await getProviderPlanAccessForUser(supabase, user.id)
  if (!canAccessFaqs) {
    return { error: "FAQs are not available on the Sprout plan." }
  }

  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabase
      .from("provider_faqs")
      .update({ sort_order: i })
      .eq("id", ids[i])
      .eq("provider_profile_id", providerProfileId)

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath("/dashboard/provider/faqs")
  revalidatePath("/dashboard/provider")
  await revalidateProviderPublicProfileForFaqs(providerProfileId)
  return { ok: true }
}
