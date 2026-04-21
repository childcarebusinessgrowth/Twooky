import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { buildSortedAgeRanges } from "./get-public-provider"

describe("buildSortedAgeRanges", () => {
  it("keeps the admin configured order ahead of label sorting", () => {
    const result = buildSortedAgeRanges(
      ["preschool_early_years_2_4_years", "infants_0_12_months", "pre_k_school_prep_4_5_years"],
      [
        { tag: "infants_0_12_months", age_range: "0-12 months", sort_order: 10 },
        { tag: "preschool_early_years_2_4_years", age_range: "2-4 years", sort_order: 30 },
        { tag: "pre_k_school_prep_4_5_years", age_range: "4-5 years", sort_order: 20 },
      ],
    )

    expect(result).toEqual(["0-12m", "4-5y", "2-4y"])
  })
})
