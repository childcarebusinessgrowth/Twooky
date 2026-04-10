import { RequireAuth } from "@/components/RequireAuth"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { ParentDiscountsClient, type ParentSponsorDiscount } from "./ParentDiscountsClient"

export const dynamic = "force-dynamic"

export default async function ParentDiscountsPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("sponsor_discounts")
    .select("id, title, description, image_url, offer_badge, category, discount_code, external_link")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  const loadError = error?.message ?? null

  const discounts: ParentSponsorDiscount[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    offerBadge: row.offer_badge,
    category: row.category,
    discountCode: row.discount_code,
    externalLink: row.external_link,
  }))

  return (
    <RequireAuth>
      <ParentDiscountsClient discounts={discounts} loadError={loadError} />
    </RequireAuth>
  )
}
