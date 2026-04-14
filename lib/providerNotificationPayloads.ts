import type { Database } from "@/lib/supabaseDatabase"

type ProviderNotificationInsert = Database["public"]["Tables"]["provider_notifications"]["Insert"]

type InquiryNotificationParams = {
  providerProfileId: string
  inquiryId: string
  fromName?: string | null
  subject?: string | null
}

type GuestInquiryNotificationParams = {
  providerProfileId: string
  inquiryId: string
  fromName?: string | null
}

type ReviewNotificationParams = {
  providerProfileId: string
  reviewId: string
  rating: number
  reviewText: string
  fromName?: string | null
}

function truncate(value: string | null | undefined, max: number): string {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return ""
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed
}

export function buildInquiryNotification({
  providerProfileId,
  inquiryId,
  fromName,
  subject,
}: InquiryNotificationParams): ProviderNotificationInsert {
  const name = fromName?.trim() || "A parent"
  return {
    provider_profile_id: providerProfileId,
    type: "inquiry",
    title: `New inquiry from ${name}`,
    message: truncate(subject || "Message sent", 80),
    href: `/dashboard/provider/inquiries?open=${inquiryId}`,
  }
}

export function buildGuestInquiryNotification({
  providerProfileId,
  inquiryId,
  fromName,
}: GuestInquiryNotificationParams): ProviderNotificationInsert {
  const name = fromName?.trim() || "A guest"
  return {
    provider_profile_id: providerProfileId,
    type: "inquiry",
    title: `New inquiry from ${name}`,
    message: "Guest inquiry",
    href: `/dashboard/provider/inquiries?open=${inquiryId}`,
  }
}

export function buildReviewNotification({
  providerProfileId,
  reviewId,
  rating,
  reviewText,
  fromName,
}: ReviewNotificationParams): ProviderNotificationInsert {
  const name = fromName?.trim() || "A parent"
  const snippet = truncate(reviewText, 60)
  return {
    provider_profile_id: providerProfileId,
    type: "review",
    title: `New ${rating}★ review from ${name}`,
    message: snippet ? `"${snippet}"` : "New review",
    href: `/dashboard/provider/reviews?open=${reviewId}`,
  }
}
