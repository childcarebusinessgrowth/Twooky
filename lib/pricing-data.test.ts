import { describe, expect, it } from "vitest"
import { getPricingPlan, getPlanMonthlyPrice, getPricingCurrencyCode, formatCurrencyAmount } from "./pricing-data"

describe("pricing data helpers", () => {
  it("switches the UK market to GBP pricing", () => {
    const grow = getPricingPlan("grow")
    const thrive = getPricingPlan("thrive")

    expect(grow && getPlanMonthlyPrice(grow, "uk")).toBe(22)
    expect(thrive && getPlanMonthlyPrice(thrive, "uk")).toBe(44)
    expect(getPricingCurrencyCode("uk")).toBe("GBP")
    expect(formatCurrencyAmount(22, "GBP")).toBe("£22")
  })

  it("keeps non-UK markets on USD pricing", () => {
    const grow = getPricingPlan("grow")

    expect(grow && getPlanMonthlyPrice(grow, "us")).toBe(29)
    expect(getPricingCurrencyCode("us")).toBe("USD")
    expect(formatCurrencyAmount(29, "USD")).toBe("$29")
  })
})
