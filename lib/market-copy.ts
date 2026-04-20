import type { MarketId } from "@/lib/market"

export type FooterSearchLink = { name: string; href: string }

export type MarketCopy = {
  label: string
  /** Primary word parents use for center-based care */
  mainCareTerm: string
  currency: string
  regulationTrustLine: string
  /** Hero line 1 — full width, white */
  heroTitleLine1: string
  /** Hero line 2 — white prefix (e.g. "for ") */
  heroTitleLine2Prefix: string
  /** Hero line 2 — accent colour (e.g. golden yellow) */
  heroTitleLine2Accent: string
  heroSubtitle: string
  heroPill: string
  featuredProvidersSubtitle: string
  popularCitiesIntro: string
  whyParentsTrustIntro: string
  verifiedProvidersTitle: string
  verifiedProvidersDescription: string
  browseProgramTypesIntro: string
  heroLocationPlaceholder: string
  compactLocationPlaceholder: string
  footerTagline: string
  footerPopularSearches: FooterSearchLink[]
  /** UAE: extra hint for curriculum-led search */
  searchCurriculumHint?: string
}

const UK: MarketCopy = {
  label: "United Kingdom",
  mainCareTerm: "nurseries",
  currency: "£ GBP",
  regulationTrustLine: "Ofsted-registered settings",
  heroTitleLine1: "The world of opportunities",
  heroTitleLine2Prefix: "for ",
  heroTitleLine2Accent: "kids & youngsters",
  heroSubtitle:
    "Find nurseries, preschools, activities, tutors, and holiday programmes near you. Read parent reviews and compare options in a few clicks.",
  heroPill: "Trusted by families across the UK",
  featuredProvidersSubtitle:
    "Highly rated nurseries, preschools, and early years settings—picked for families in your area.",
  popularCitiesIntro:
    "Popular cities for childcare and kids’ activities—start with a place you know.",
  whyParentsTrustIntro:
    "We keep things simple: clear information, honest reviews, and tools that help you choose with confidence.",
  verifiedProvidersTitle: "Verified & regulated",
  verifiedProvidersDescription:
    "We prioritise providers who meet local requirements—including Ofsted registration where it applies.",
  browseProgramTypesIntro:
    "Browse by age and programme—from baby rooms to preschool and after-school—so you can shortlist fast.",
  heroLocationPlaceholder: "City or postcode",
  compactLocationPlaceholder: "Location (city or postcode)",
  footerTagline: "Childcare, classes, and activities for every family",
  footerPopularSearches: [
    { name: "Nursery search", href: "/search" },
    { name: "Preschools", href: "/programs/preschool" },
    { name: "Montessori", href: "/programs/montessori" },
    { name: "Infant rooms", href: "/programs/infant-care" },
    { name: "After-school clubs", href: "/programs/after-school" },
  ],
}

const US: MarketCopy = {
  label: "United States",
  mainCareTerm: "daycare & preschool",
  currency: "$ USD",
  regulationTrustLine: "State-licensed providers; many accredited (e.g. NAEYC)",
  heroTitleLine1: "The world of opportunities",
  heroTitleLine2Prefix: "for ",
  heroTitleLine2Accent: "kids & youngsters",
  heroSubtitle:
    "Find daycare, preschools, sports, tutoring, and summer camps near you. Read parent reviews and book tours with confidence.",
  heroPill: "Trusted by families nationwide",
  featuredProvidersSubtitle:
    "Top-rated daycares, preschools, and learning centres—selected for families in your area.",
  popularCitiesIntro:
    "Popular metros for childcare and kids’ programs—pick a city to explore listings.",
  whyParentsTrustIntro:
    "Straightforward search, real parent feedback, and clear details so you spend less time guessing.",
  verifiedProvidersTitle: "Licensed & vetted",
  verifiedProvidersDescription:
    "We highlight providers that meet state licensing and show credentials parents care about.",
  browseProgramTypesIntro:
    "Explore by age and program type—from infant care to pre-K and after-school—to narrow your list quickly.",
  heroLocationPlaceholder: "City, state, or ZIP",
  compactLocationPlaceholder: "City, state, or ZIP",
  footerTagline: "Daycare, classes, and activities for every family",
  footerPopularSearches: [
    { name: "Daycare near me", href: "/search" },
    { name: "Preschools", href: "/programs/preschool" },
    { name: "Montessori", href: "/programs/montessori" },
    { name: "Infant care", href: "/programs/infant-care" },
    { name: "After-school programs", href: "/programs/after-school" },
  ],
}

const UAE: MarketCopy = {
  label: "United Arab Emirates",
  mainCareTerm: "nurseries & FS",
  currency: "AED",
  regulationTrustLine: "KHDA / ADEK-rated schools where applicable",
  heroTitleLine1: "The world of opportunities",
  heroTitleLine2Prefix: "for ",
  heroTitleLine2Accent: "kids & youngsters",
  heroSubtitle:
    "Find nurseries, activities, tutoring, and holiday camps in Dubai, Abu Dhabi, and beyond. Filter by curriculum—British, American, IB—and read reviews from other parents.",
  heroPill: "Trusted by families in the UAE",
  featuredProvidersSubtitle:
    "Featured nurseries and learning centres—chosen for families in your emirate.",
  popularCitiesIntro:
    "Explore popular cities for schools, nurseries, and kids’ activities across the UAE.",
  whyParentsTrustIntro:
    "Clear listings, curriculum signals, and parent reviews so you can compare options on your terms.",
  verifiedProvidersTitle: "Accredited & transparent",
  verifiedProvidersDescription:
    "We surface ratings and accreditation where available—including KHDA and ADEK—so you know what to expect.",
  browseProgramTypesIntro:
    "Browse by age and programme—from foundation stage to enrichment—tailored to how families search here.",
  heroLocationPlaceholder: "City or area (e.g. Dubai Marina)",
  compactLocationPlaceholder: "City or area",
  footerTagline: "Nurseries, classes, and activities for every family",
  footerPopularSearches: [
    { name: "Nursery search", href: "/search" },
    { name: "British / American / IB", href: "/programs" },
    { name: "Montessori", href: "/programs/montessori" },
    { name: "Foundation stage", href: "/programs/preschool" },
    { name: "After-school", href: "/programs/after-school" },
  ],
  searchCurriculumHint: "Many families search by British, American, or IB curriculum—we show these on listings.",
}

const GLOBAL: MarketCopy = {
  label: "Global",
  mainCareTerm: "childcare",
  currency: "Local currency",
  regulationTrustLine: "Regulatory details vary by country",
  heroTitleLine1: "The world of opportunities",
  heroTitleLine2Prefix: "for ",
  heroTitleLine2Accent: "kids & youngsters",
  heroSubtitle:
    "Find childcare, activities, tutoring, and camps. Compare trusted providers and reviews in places we currently support.",
  heroPill: "Trusted by families in multiple countries",
  featuredProvidersSubtitle:
    "Top-rated providers from across our directory to help you get started quickly.",
  popularCitiesIntro:
    "Explore cities across the countries currently available on Twooky.",
  whyParentsTrustIntro:
    "Clear listings, real parent reviews, and practical filters to help families make confident choices.",
  verifiedProvidersTitle: "Verified where available",
  verifiedProvidersDescription:
    "We surface provider details and trust signals so you can compare options side by side.",
  browseProgramTypesIntro:
    "Browse by age and programme type to quickly narrow down the right fit for your family.",
  heroLocationPlaceholder: "City, area, or postcode",
  compactLocationPlaceholder: "Location",
  footerTagline: "Childcare, classes, and activities for every family",
  footerPopularSearches: [
    { name: "Childcare search", href: "/search" },
    { name: "Preschools", href: "/programs/preschool" },
    { name: "Montessori", href: "/programs/montessori" },
    { name: "Infant care", href: "/programs/infant-care" },
    { name: "After-school programs", href: "/programs/after-school" },
  ],
}

export const marketCopy: Record<MarketId, MarketCopy> = {
  global: GLOBAL,
  uk: UK,
  us: US,
  uae: UAE,
}

export function getMarketCopy(market: MarketId): MarketCopy {
  return marketCopy[market]
}
