import { describe, expect, it, vi, beforeEach } from "vitest"

type StripeClientMock = {
  webhooks: {
    constructEvent: ReturnType<typeof vi.fn>
  }
  subscriptions: {
    retrieve: ReturnType<typeof vi.fn>
  }
}

vi.mock("@/lib/stripe", () => {
  return {
    getStripeWebhookSecret: () => "whsec_test",
    getStripeServerClient: () => ({
      webhooks: {
        constructEvent: vi.fn(),
      },
      subscriptions: {
        retrieve: vi.fn(),
      },
    }),
  }
})

vi.mock("@/lib/supabaseAdmin", () => {
  return {
    getSupabaseAdminClient: vi.fn(),
  }
})

vi.mock("@/lib/provider-billing", () => {
  return {
    syncProviderSubscriptionFromStripe: vi.fn(),
  }
})

function createStripeEvent(overrides: Record<string, unknown>) {
  return {
    id: "evt_1",
    type: "checkout.session.completed",
    created: 123,
    livemode: false,
    data: { object: {} },
    ...overrides,
  } as unknown as import("stripe").Stripe.Event
}

describe("/api/billing/webhook", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("processes a new event and ignores duplicates", async () => {
    const { getStripeServerClient } = await import("@/lib/stripe")
    const { getSupabaseAdminClient } = await import("@/lib/supabaseAdmin")
    const { syncProviderSubscriptionFromStripe } = await import("@/lib/provider-billing")
    const { POST } = await import("./route")

    const stripe = getStripeServerClient() as unknown as StripeClientMock

    stripe.webhooks.constructEvent.mockReturnValue(
      createStripeEvent({
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "subscription",
            subscription: "sub_123",
          },
        },
      }),
    )

    stripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_123",
      status: "active",
      cancel_at_period_end: false,
      metadata: { provider_profile_id: "00000000-0000-0000-0000-000000000001", plan_id: "grow", billing_interval: "month" },
      customer: "cus_123",
      items: { data: [{ current_period_start: 1, current_period_end: 2, price: { id: "price_123", product: "prod_123" } }] },
      canceled_at: null,
    })

    const getSupabaseAdminClientMock = getSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>
    getSupabaseAdminClientMock.mockReturnValue({
      from: () => ({
        upsert: () => ({
          select: async () => ({ data: [{ event_id: "evt_1" }], error: null }),
        }),
      }),
    })

    const req1 = new Request("http://localhost/api/billing/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "payload",
    })
    const res1 = await POST(req1)
    expect(res1.status).toBe(200)
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledTimes(1)
    expect(syncProviderSubscriptionFromStripe).toHaveBeenCalledTimes(1)

    getSupabaseAdminClientMock.mockReturnValue({
      from: () => ({
        upsert: () => ({
          select: async () => ({ data: [], error: null }),
        }),
      }),
    })

    const req2 = new Request("http://localhost/api/billing/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "payload",
    })
    const res2 = await POST(req2)
    expect(res2.status).toBe(200)
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledTimes(1)
  })

  it("re-fetches subscription for subscription lifecycle events", async () => {
    const { getStripeServerClient } = await import("@/lib/stripe")
    const { getSupabaseAdminClient } = await import("@/lib/supabaseAdmin")
    const { POST } = await import("./route")

    const stripe = getStripeServerClient() as unknown as StripeClientMock

    stripe.webhooks.constructEvent.mockReturnValue(
      createStripeEvent({
        id: "evt_2",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_999",
          },
        },
      }),
    )

    stripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_999",
      status: "active",
      cancel_at_period_end: false,
      metadata: { provider_profile_id: "00000000-0000-0000-0000-000000000001", plan_id: "grow", billing_interval: "month" },
      customer: "cus_123",
      items: { data: [{ current_period_start: 1, current_period_end: 2, price: { id: "price_123", product: "prod_123" } }] },
      canceled_at: null,
    })

    const getSupabaseAdminClientMock = getSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>
    getSupabaseAdminClientMock.mockReturnValue({
      from: () => ({
        upsert: () => ({
          select: async () => ({ data: [{ event_id: "evt_2" }], error: null }),
        }),
      }),
    })

    const req = new Request("http://localhost/api/billing/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "payload",
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_999", expect.any(Object))
  })
})

