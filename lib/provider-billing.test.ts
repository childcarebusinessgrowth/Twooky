import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
import {
  billingPeriodToStripeInterval,
  formatProviderBillingStatus,
  getPlanFromStripePriceId,
  hasPaidSubscriptionEntitlement,
} from "./provider-billing"

describe("provider billing helpers", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_PRICE_GROW_MONTHLY", "price_grow_monthly")
    vi.stubEnv("STRIPE_PRICE_GROW_YEARLY", "price_grow_yearly")
    vi.stubEnv("STRIPE_PRICE_THRIVE_MONTHLY", "price_thrive_monthly")
    vi.stubEnv("STRIPE_PRICE_THRIVE_YEARLY", "price_thrive_yearly")
  })

  it("maps UI billing periods to Stripe intervals", () => {
    expect(billingPeriodToStripeInterval("monthly")).toBe("month")
    expect(billingPeriodToStripeInterval("yearly")).toBe("year")
  })

  it("maps Stripe price ids back to plan and interval", () => {
    expect(getPlanFromStripePriceId("price_grow_monthly")).toEqual({
      planId: "grow",
      billingInterval: "month",
    })
    expect(getPlanFromStripePriceId("price_thrive_yearly")).toEqual({
      planId: "thrive",
      billingInterval: "year",
    })
    expect(getPlanFromStripePriceId("unknown_price")).toBeNull()
  })

  it("grants paid entitlement only for active Stripe subscription states", () => {
    expect(
      hasPaidSubscriptionEntitlement({
        stripe_subscription_id: "sub_123",
        status: "active",
      }),
    ).toBe(true)

    expect(
      hasPaidSubscriptionEntitlement({
        stripe_subscription_id: "sub_123",
        status: "canceled",
      }),
    ).toBe(false)

    expect(
      hasPaidSubscriptionEntitlement({
        stripe_subscription_id: null,
        status: "active",
      }),
    ).toBe(false)
  })

  it("formats canceling subscriptions with a clearer label", () => {
    expect(formatProviderBillingStatus("active", true)).toBe("Canceling at period end")
    expect(formatProviderBillingStatus("past_due", false)).toBe("Past due")
  })
})
