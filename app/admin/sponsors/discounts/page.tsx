import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { AdminSponsorDiscountsClient } from "./pageClient"

export const dynamic = "force-dynamic"

export type SponsorDiscountRow = {
  id: string
  title: string
  description: string
  image_url: string
  discount_code: string | null
  external_link: string | null
  category: string
  offer_badge: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export default async function AdminSponsorDiscountsPage() {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("sponsor_discounts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[admin/sponsors/discounts]", error.message)
  }

  return <AdminSponsorDiscountsClient initialRows={(data ?? []) as SponsorDiscountRow[]} />
}
