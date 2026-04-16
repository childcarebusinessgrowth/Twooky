import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

vi.mock("@/lib/supabaseAdmin", () => {
  return {
    getSupabaseAdminClient: vi.fn(),
  }
})

import { syncProviderSubscriptionFromStripe } from "@/lib/provider-billing"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

describe("syncProviderSubscriptionFromStripe", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_PRICE_GROW_MONTHLY", "price_grow_monthly")
    vi.stubEnv("STRIPE_PRICE_GROW_YEARLY", "price_grow_yearly")
    vi.stubEnv("STRIPE_PRICE_THRIVE_MONTHLY", "price_thrive_monthly")
    vi.stubEnv("STRIPE_PRICE_THRIVE_YEARLY", "price_thrive_yearly")
  })

  it("calls atomic sync RPC with resolved paid plan", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    const getSupabaseAdminClientMock = getSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>
    getSupabaseAdminClientMock.mockReturnValue({
      rpc,
      from: vi.fn(),
    })

    await syncProviderSubscriptionFromStripe({
      id: "sub_123",
      status: "active",
      cancel_at_period_end: false,
      metadata: {
        provider_profile_id: "00000000-0000-0000-0000-000000000001",
        plan_id: "grow",
        billing_interval: "month",
      },
      customer: "cus_123",
      items: {
        data: [
          {
            current_period_start: 1,
            current_period_end: 2,
            price: {
              id: "price_grow_monthly",
              product: "prod_123",
            },
          },
        ],
      },
      canceled_at: null,
    } as unknown as import("stripe").Stripe.Subscription)

    expect(rpc).toHaveBeenCalledWith(
      "sync_provider_billing_and_plan",
      expect.objectContaining({
        p_provider_profile_id: "00000000-0000-0000-0000-000000000001",
        p_plan_id: "grow",
        p_status: "active",
      }),
    )
  })

  it("falls back to sprout when subscription is not entitled", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    const getSupabaseAdminClientMock = getSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>
    getSupabaseAdminClientMock.mockReturnValue({
      rpc,
      from: vi.fn(),
    })

    await syncProviderSubscriptionFromStripe({
      id: "sub_999",
      status: "unpaid",
      cancel_at_period_end: false,
      metadata: {
        provider_profile_id: "00000000-0000-0000-0000-000000000002",
        plan_id: "thrive",
        billing_interval: "month",
      },
      customer: "cus_999",
      items: {
        data: [
          {
            current_period_start: 1,
            current_period_end: 2,
            price: {
              id: "price_thrive_monthly",
              product: "prod_999",
            },
          },
        ],
      },
      canceled_at: null,
    } as unknown as import("stripe").Stripe.Subscription)

    expect(rpc).toHaveBeenCalledWith(
      "sync_provider_billing_and_plan",
      expect.objectContaining({
        p_provider_profile_id: "00000000-0000-0000-0000-000000000002",
        p_plan_id: "sprout",
        p_status: "unpaid",
      }),
    )
  })
})

