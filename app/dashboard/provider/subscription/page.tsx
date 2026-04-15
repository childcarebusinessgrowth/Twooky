import { Check, Sparkles } from "lucide-react"
import { ManageBillingButton } from "@/components/billing/manage-billing-button"
import { StartCheckoutButton } from "@/components/billing/start-checkout-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  annualUsdTotal,
  getPricingPlan,
  isPaidPlanId,
  PRICING_PLANS,
  type BillingPeriod,
  type PlanId,
} from "@/lib/pricing-data"
import {
  formatProviderBillingInterval,
  formatProviderBillingStatus,
  getProviderBillingSnapshot,
  hasPaidSubscriptionEntitlement,
} from "@/lib/provider-billing"
import { resolveOwnedProviderProfileId } from "@/lib/provider-ownership"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { cn } from "@/lib/utils"

type PageProps = {
  searchParams?: Promise<{ checkout?: string }>
}

function formatPlanPrice(planId: "grow" | "thrive", billingPeriod: BillingPeriod) {
  const plan = getPricingPlan(planId)
  if (!plan || plan.monthlyUsd == null || plan.monthlyUsd === undefined) return "Contact us"
  if (billingPeriod === "monthly") return `$${plan.monthlyUsd}/mo`
  return `$${annualUsdTotal(plan.monthlyUsd)}/yr`
}

function formatDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export default async function SubscriptionPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {}
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let providerPlanId: PlanId = "sprout"
  let providerPlanName = "Sprout"
  let billing: Awaited<ReturnType<typeof getProviderBillingSnapshot>>["billing"] = null

  if (user) {
    const providerProfileId = await resolveOwnedProviderProfileId(supabase, user.id)
    const snapshot = await getProviderBillingSnapshot(supabase, providerProfileId)
    providerPlanId = snapshot.providerPlanId
    providerPlanName = snapshot.providerPlanName
    billing = snapshot.billing
  }

  const hasPaidPlan = hasPaidSubscriptionEntitlement(billing)
  const currentInterval = billing?.billing_interval ?? null
  const renewalDate = billing?.cancel_at_period_end
    ? formatDate(billing.current_period_end)
    : formatDate(billing?.current_period_end)
  const statusLabel = billing ? formatProviderBillingStatus(billing.status, billing.cancel_at_period_end) : null
  const intervalLabel = formatProviderBillingInterval(currentInterval)
  const checkoutState = params.checkout === "success" ? "success" : params.checkout === "canceled" ? "canceled" : null
  const selectablePlans = PRICING_PLANS.filter((plan) => plan.id !== "kinderpathPro")
  const isStripeManagedAssignedPlan = providerPlanId === "grow" || providerPlanId === "thrive"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription</h1>
        <p className="text-muted-foreground">
          Review your assigned provider plan and any Stripe billing attached to it.
        </p>
      </div>

      {checkoutState === "success" ? (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="py-5 text-sm text-foreground">
            Stripe checkout completed. Billing status will update here as soon as Stripe confirms the
            subscription.
          </CardContent>
        </Card>
      ) : checkoutState === "canceled" ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-5 text-sm text-foreground">
            Checkout was canceled. Your plan has not changed.
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Assigned plan</p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-bold text-foreground">{providerPlanName}</p>
              {isStripeManagedAssignedPlan ? (
                <Badge variant={hasPaidPlan ? "default" : "secondary"}>
                  {hasPaidPlan ? "Billing active" : "Not paid in Stripe"}
                </Badge>
              ) : null}
              {statusLabel ? <Badge variant="outline">{statusLabel}</Badge> : null}
              {intervalLabel ? <Badge variant="secondary">{intervalLabel}</Badge> : null}
            </div>
            {providerPlanId === "sprout" ? (
              <p className="text-sm text-muted-foreground">
                You are currently on the free provider plan.
              </p>
            ) : providerPlanId === "kinderpathPro" ? (
              <p className="text-sm text-muted-foreground">
                This plan is managed outside Stripe by your account manager.
              </p>
            ) : billing?.cancel_at_period_end && renewalDate && hasPaidPlan ? (
              <p className="text-sm text-muted-foreground">Access ends on {renewalDate}</p>
            ) : renewalDate && hasPaidPlan ? (
              <p className="text-sm text-muted-foreground">Renews on {renewalDate}</p>
            ) : billing?.stripe_subscription_id ? (
              <p className="text-sm text-muted-foreground">
                Your features come from the plan assigned to this provider. Stripe billing is currently{" "}
                {statusLabel?.toLowerCase() ?? "inactive"}.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your features come from the plan assigned to this provider. No active Stripe
                subscription is attached yet.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {billing?.stripe_customer_id ? (
              <ManageBillingButton variant="outline">Manage Billing</ManageBillingButton>
            ) : null}
            {providerPlanId === "kinderpathPro" ? (
              <Button variant="outline" asChild>
                <a href="/contact">Contact account manager</a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {selectablePlans.map((plan) => {
          const isCurrentPlan = providerPlanId === plan.id
          const paidPlanId = isPaidPlanId(plan.id) ? plan.id : null
          const isPopular = plan.badge === "Most Popular"

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative border-border/60",
                isCurrentPlan && "border-primary shadow-sm",
                isPopular && "border-emerald-600/30 shadow-lg",
              )}
            >
              {isPopular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-secondary text-secondary-foreground">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {plan.badge}
                  </Badge>
                </div>
              ) : null}
              {isCurrentPlan ? (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-primary">Current Plan</Badge>
                </div>
              ) : null}

              <CardHeader className="space-y-2 pt-8">
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.tagline}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  {plan.monthlyUsd === null ? (
                    <>
                      <p className="text-3xl font-bold text-foreground">Free</p>
                      <p className="text-sm text-muted-foreground">Basic directory presence forever.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Monthly</p>
                      <p className="text-3xl font-bold text-foreground">
                        {paidPlanId ? formatPlanPrice(paidPlanId, "monthly") : "Contact us"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Yearly: {paidPlanId ? formatPlanPrice(paidPlanId, "yearly") : "Contact us"} billed once per year.
                      </p>
                    </>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.highlights.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {paidPlanId ? (
                  <div className="space-y-2">
                    <StartCheckoutButton
                      planId={paidPlanId}
                      billingPeriod="monthly"
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      disabled={isCurrentPlan && currentInterval === "month"}
                    >
                      {isCurrentPlan && currentInterval === "month"
                        ? "Current monthly plan"
                        : hasPaidPlan
                          ? "Change in billing portal"
                          : "Subscribe monthly"}
                    </StartCheckoutButton>
                    <StartCheckoutButton
                      planId={paidPlanId}
                      billingPeriod="yearly"
                      className="w-full"
                      variant="outline"
                      disabled={isCurrentPlan && currentInterval === "year"}
                    >
                      {isCurrentPlan && currentInterval === "year"
                        ? "Current yearly plan"
                        : hasPaidPlan
                          ? "Change in billing portal"
                          : "Subscribe yearly"}
                    </StartCheckoutButton>
                  </div>
                ) : (
                  <Button className="w-full" variant="outline" disabled={isCurrentPlan}>
                    {isCurrentPlan ? "Current Plan" : "Automatic fallback when no paid plan is active"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
