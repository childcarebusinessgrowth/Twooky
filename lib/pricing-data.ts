export type PlanId = "sprout" | "grow" | "thrive" | "kinderpathPro"
export type PaidPlanId = Extract<PlanId, "grow" | "thrive">
export type BillingPeriod = "monthly" | "yearly"

export type PlanTheme = "blue" | "lightGreen" | "darkGreen" | "orange"

export type PricingPlan = {
  id: PlanId
  name: string
  tagline: string
  theme: PlanTheme
  badge?: string
  /** Monthly price in USD; null = free; undefined = custom */
  monthlyUsd: number | null | undefined
  ctaLabel: string
  ctaHref: string
  /** Short highlights for card body (★ items marked in copy) */
  highlights: { text: string; exclusive?: boolean }[]
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "sprout",
    name: "Sprout",
    tagline: "Get discovered",
    theme: "blue",
    monthlyUsd: null,
    ctaLabel: "Get started free",
    ctaHref: "/for-providers",
    highlights: [
      { text: "Listed in directory with basic profile" },
      { text: "Standard search placement" },
      { text: "Training, resources & help centre" },
    ],
  },
  {
    id: "grow",
    name: "Grow",
    tagline: "Stand out locally",
    theme: "lightGreen",
    monthlyUsd: 29,
    ctaLabel: "Choose Grow",
    ctaHref: "/pricing",
    highlights: [
      { text: "Full enhanced profile, photos & virtual tour" },
      { text: "Boosted search placement" },
      { text: "Direct parent enquiries & email support" },
    ],
  },
  {
    id: "thrive",
    name: "Thrive",
    tagline: "Convert more families",
    theme: "darkGreen",
    badge: "Most Popular",
    monthlyUsd: 59,
    ctaLabel: "Choose Thrive",
    ctaHref: "/pricing",
    highlights: [
      { text: "Video showcase & verified badge" },
      { text: "Priority search placement & CRM dashboard" },
      { text: "Waiting list, tour booking & priority support" },
    ],
  },
  {
    id: "kinderpathPro",
    name: "KinderPath Pro",
    tagline: "Done-for-you growth",
    theme: "orange",
    monthlyUsd: undefined,
    ctaLabel: "Talk to us about your package",
    ctaHref: "/contact",
    highlights: [
      { text: "Prime placement, homepage & sponsored categories", exclusive: true },
      { text: "Unlimited parent campaigns & push notifications", exclusive: true },
      { text: "Full digital marketing & named account manager", exclusive: true },
    ],
  },
]

export type FeatureRow = {
  label: string
  exclusive?: boolean
  /** Per plan: true = included, false = not included, "text" = show detail string */
  sprout: boolean | "text"
  grow: boolean | "text"
  thrive: boolean | "text"
  kinderpathPro: boolean | "text"
  /** Optional cell text (e.g. "Unlimited") */
  detail?: Partial<Record<PlanId, string>>
}

export type FeatureCategory = {
  title: string
  rows: FeatureRow[]
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    title: "Listing & profile",
    rows: [
      {
        label: "Listed in directory",
        sprout: true,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Basic profile (name, location, type)",
        sprout: true,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Full enhanced profile",
        sprout: false,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Photos & virtual tour",
        sprout: false,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Video showcase",
        sprout: false,
        grow: false,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Description, USPs & fee sheet",
        sprout: false,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Verified badge",
        sprout: false,
        grow: false,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Featured label (premium placement badge)",
        exclusive: true,
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
      {
        label: "Dedicated mini-website page on platform",
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: false,
      },
      {
        label: "Prevent sponsors advertising on your profile",
        sprout: false,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
    ],
  },
  {
    title: "Enquiries & enrolment",
    rows: [
      {
        label: "Direct parent enquiries",
        sprout: false,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Waiting list tool",
        sprout: false,
        grow: false,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Automated tour booking",
        sprout: false,
        grow: false,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Direct parent messaging (preferred providers)",
        sprout: false,
        grow: false,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "CRM lead dashboard",
        sprout: false,
        grow: false,
        thrive: true,
        kinderpathPro: true,
      },
    ],
  },
  {
    title: "Visibility & search",
    rows: [
      {
        label: "Standard search placement",
        sprout: true,
        grow: false,
        thrive: false,
        kinderpathPro: false,
      },
      {
        label: "Boosted search placement",
        sprout: false,
        grow: true,
        thrive: false,
        kinderpathPro: false,
      },
      {
        label: "Priority search placement",
        sprout: false,
        grow: false,
        thrive: true,
        kinderpathPro: false,
      },
      {
        label: "Prime / pinned placement (top of results)",
        exclusive: true,
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
      {
        label: "Homepage & featured spots on platform",
        exclusive: true,
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
      {
        label: "Sponsored category placements",
        exclusive: true,
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
    ],
  },
  {
    title: "Parent portal campaigns",
    rows: [
      {
        label: "Offers & promos to member parents",
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
      {
        label: "Parent ad campaigns per month (visibility)",
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
        detail: { kinderpathPro: "Unlimited" },
      },
      {
        label: "Push notifications to relevant parents",
        exclusive: true,
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
    ],
  },
  {
    title: "Digital marketing",
    rows: [
      {
        label: "Full digital marketing service",
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
    ],
  },
  {
    title: "Support",
    rows: [
      {
        label: "Free access to training & resources",
        sprout: true,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Self-serve help centre",
        sprout: true,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Email support",
        sprout: false,
        grow: true,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Priority email & chat support",
        sprout: false,
        grow: false,
        thrive: true,
        kinderpathPro: true,
      },
      {
        label: "Dedicated account manager",
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
      {
        label: "Named account manager",
        exclusive: true,
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
      {
        label: "Quarterly strategy reviews",
        exclusive: true,
        sprout: false,
        grow: false,
        thrive: false,
        kinderpathPro: true,
      },
    ],
  },
]

export const PLAN_IDS: PlanId[] = ["sprout", "grow", "thrive", "kinderpathPro"]
export const PAID_PLAN_IDS: PaidPlanId[] = ["grow", "thrive"]

/** Annual billing: pay for 11 months, 12th month free (matches package spreadsheet). */
export const ANNUAL_PAID_MONTHS = 11

export function annualUsdTotal(monthlyUsd: number): number {
  return monthlyUsd * ANNUAL_PAID_MONTHS
}

export function annualSavingsUsd(monthlyUsd: number): number {
  return monthlyUsd
}

export const PRICING_FOOTNOTE =
  "KinderPath Pro exclusive, prime platform placements & push notifications included as part of your done-for-you package."

export function getPricingPlan(planId: PlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === planId)
}

export function isPaidPlanId(value: string | null | undefined): value is PaidPlanId {
  return value === "grow" || value === "thrive"
}
