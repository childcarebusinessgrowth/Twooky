import { unstable_cache } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { CACHE_TAGS } from "@/lib/cache-tags"

export interface CityMonthlyCostGuide {
  cityId: string
  cityName: string
  citySlug: string
  countryId: string
  countryCode: string
  countryName: string
  providerCount: number
  providersWithPricingCount: number
  medianDailyFee: number | null
  estimatedMonthlyFee: number | null
}

async function loadCityMonthlyCostGuides(): Promise<CityMonthlyCostGuide[]> {
  try {
    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from("city_monthly_cost_guides")
      .select(
        "city_id, city_name, city_slug, country_id, country_code, country_name, provider_count, providers_with_pricing_count, median_daily_fee, estimated_monthly_fee",
      )
      .order("country_name", { ascending: true })
      .order("city_name", { ascending: true })

    if (!error) {
      return (data ?? []).map((row) => ({
        cityId: row.city_id as string,
        cityName: row.city_name as string,
        citySlug: row.city_slug as string,
        countryId: row.country_id as string,
        countryCode: row.country_code as string,
        countryName: row.country_name as string,
        providerCount: Number(row.provider_count ?? 0),
        providersWithPricingCount: Number(row.providers_with_pricing_count ?? 0),
        medianDailyFee: row.median_daily_fee == null ? null : Number(row.median_daily_fee),
        estimatedMonthlyFee:
          row.estimated_monthly_fee == null ? null : Number(row.estimated_monthly_fee),
      }))
    }

    // Backward compatibility while environments still have the old view shape.
    if (error.message?.includes("providers_with_pricing_count")) {
      const legacy = await supabase
        .from("city_monthly_cost_guides")
        .select(
          "city_id, city_name, city_slug, country_id, country_code, country_name, provider_count, providers_with_tuition_count, median_monthly_tuition",
        )
        .order("country_name", { ascending: true })
        .order("city_name", { ascending: true })

      if (legacy.error) {
        console.error("[cost-guides] Failed legacy fallback query", legacy.error)
        return []
      }

      return (legacy.data ?? []).map((row) => {
        const medianMonthly = row.median_monthly_tuition == null
          ? null
          : Number(row.median_monthly_tuition)
        const derivedDaily = medianMonthly == null ? null : Math.round(medianMonthly / 22)
        return {
          cityId: row.city_id as string,
          cityName: row.city_name as string,
          citySlug: row.city_slug as string,
          countryId: row.country_id as string,
          countryCode: row.country_code as string,
          countryName: row.country_name as string,
          providerCount: Number(row.provider_count ?? 0),
          providersWithPricingCount: Number(row.providers_with_tuition_count ?? 0),
          medianDailyFee: derivedDaily,
          estimatedMonthlyFee: medianMonthly,
        }
      })
    }

    console.error("[cost-guides] Failed to fetch city monthly cost guides", error)
    return []
  } catch (error) {
    console.error("[cost-guides] Unexpected error loading city monthly cost guides", error)
    return []
  }
}

const loadCityMonthlyCostGuidesCached = unstable_cache(
  () => loadCityMonthlyCostGuides(),
  ["city-monthly-cost-guides"],
  { revalidate: 300, tags: [CACHE_TAGS.cityMonthlyCostGuides] },
)

export async function getCityMonthlyCostGuides(): Promise<CityMonthlyCostGuide[]> {
  return loadCityMonthlyCostGuidesCached()
}
