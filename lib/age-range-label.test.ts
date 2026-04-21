import { describe, expect, it } from "vitest"
import { formatAgeRangeValues, normalizeAgeRangeLabel, normalizeAgeRangeTag } from "./age-range-label"

describe("normalizeAgeRangeLabel", () => {
  it("keeps already formatted labels readable", () => {
    expect(normalizeAgeRangeLabel("Toddler (1-2y)")).toBe("Toddler (1-2y)")
  })

  it("maps canonical age-group tags to ranges", () => {
    expect(normalizeAgeRangeLabel("school_age")).toBe("5+")
    expect(normalizeAgeRangeLabel("prek")).toBe("4-5 years")
  })

  it("extracts ranges from slug-style tag values", () => {
    expect(normalizeAgeRangeLabel("infants_0_12_months")).toBe("0-12 months")
    expect(normalizeAgeRangeLabel("pre_k_school_prep_4_5_years")).toBe("4-5 years")
    expect(normalizeAgeRangeLabel("preschool_early_years_2_4_years")).toBe("2-4 years")
  })

  it("normalizes age range tags from legacy labels", () => {
    expect(normalizeAgeRangeTag("school age")).toBe("school_age")
    expect(normalizeAgeRangeTag("4-5 years")).toBe("prek")
  })

  it("formats multiple age ranges for display", () => {
    expect(formatAgeRangeValues(["infant", "toddler", "school_age"])).toBe("0-12 months, 1-2 years, 5+")
  })
})
