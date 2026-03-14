import "server-only"

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import type { PopularLocationGroup } from "@/lib/popular-locations"

type CityRow = {
  id: string
  country_id: string
  name: string
  slug: string
  search_country_code: string
  search_city_slug: string
  is_popular: boolean
  sort_order: number
  is_active: boolean
}

export async function getPopularLocationGroups(): Promise<PopularLocationGroup[]> {
  // Temporary fake data for UK, UAE, and USA
  return [
    {
      country: "UK",
      locations: [
        {
          label: "Childcares in London",
          href: "/search?country=uk&city=london",
        },
        {
          label: "Childcares in Manchester",
          href: "/search?country=uk&city=manchester",
        },
        {
          label: "Childcares in Birmingham",
          href: "/search?country=uk&city=birmingham",
        },
        {
          label: "Childcares in Leeds",
          href: "/search?country=uk&city=leeds",
        },
        {
          label: "Childcares in Glasgow",
          href: "/search?country=uk&city=glasgow",
        },
        {
          label: "Childcares in Liverpool",
          href: "/search?country=uk&city=liverpool",
        },
      ],
    },
    {
      country: "UAE",
      locations: [
        {
          label: "Childcares in Dubai",
          href: "/search?country=uae&city=dubai",
        },
        {
          label: "Childcares in Abu Dhabi",
          href: "/search?country=uae&city=abu-dhabi",
        },
        {
          label: "Childcares in Sharjah",
          href: "/search?country=uae&city=sharjah",
        },
        {
          label: "Childcares in Ajman",
          href: "/search?country=uae&city=ajman",
        },
        {
          label: "Childcares in Ras Al Khaimah",
          href: "/search?country=uae&city=ras-al-khaimah",
        },
        {
          label: "Childcares in Fujairah",
          href: "/search?country=uae&city=fujairah",
        },
      ],
    },
    {
      country: "USA",
      locations: [
        {
          label: "Childcares in New York",
          href: "/search?country=usa&city=new-york",
        },
        {
          label: "Childcares in San Francisco",
          href: "/search?country=usa&city=san-francisco",
        },
        {
          label: "Childcares in Los Angeles",
          href: "/search?country=usa&city=los-angeles",
        },
        {
          label: "Childcares in Chicago",
          href: "/search?country=usa&city=chicago",
        },
        {
          label: "Childcares in Houston",
          href: "/search?country=usa&city=houston",
        },
        {
          label: "Childcares in Miami",
          href: "/search?country=usa&city=miami",
        },
      ],
    },
  ]
}

export async function getCityBySlug(slug: string): Promise<CityRow | null> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("cities")
    .select(
      "id, country_id, name, slug, search_country_code, search_city_slug, is_popular, sort_order, is_active",
    )
    .eq("slug", slug)
    .maybeSingle<CityRow>()

  if (error) {
    console.error("[locations] Failed to load city by slug", slug, error.message)
    return null
  }

  return data ?? null
}

