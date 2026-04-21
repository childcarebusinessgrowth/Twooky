"use client"

import Link from "next/link"
import { Fragment, useState } from "react"
import { BadgeCheck, Check, Minus, Star } from "lucide-react"
import { StartCheckoutButton } from "@/components/billing/start-checkout-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  annualSavingsUsd,
  annualUsdTotal,
  FEATURE_CATEGORIES,
  PLAN_IDS,
  PRICING_FOOTNOTE,
  PRICING_PLANS,
  formatCurrencyAmount,
  getPlanMonthlyPrice,
  getPricingCurrencyCode,
  type FeatureRow,
  type PlanTheme,
  type PricingPlan,
  isPaidPlanId,
  type PlanId,
} from "@/lib/pricing-data"
import type { MarketId } from "@/lib/market"

type PricingBillingCycle = "monthly" | "annual"

const THEME: Record<
  PlanTheme,
  { stripBg: string; softBg: string; accentText: string }
> = {
  blue: {
    stripBg: "bg-primary",
    softBg: "bg-primary/10",
    accentText: "text-primary",
  },
  lightGreen: {
    stripBg: "bg-secondary",
    softBg: "bg-secondary/10",
    accentText: "text-secondary",
  },
  darkGreen: {
    stripBg: "bg-tertiary",
    softBg: "bg-tertiary/12",
    accentText: "text-tertiary",
  },
  orange: {
    stripBg: "bg-secondary",
    softBg: "bg-secondary/10",
    accentText: "text-secondary",
  },
}

function BillingToggle({
  value,
  onChange,
}: {
  value: PricingBillingCycle
  onChange: (next: PricingBillingCycle) => void
}) {
  return (
    <div
      className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 sm:max-w-none"
      role="radiogroup"
      aria-label="Billing period"
    >
      <div className="relative flex w-full max-w-78 rounded-full border border-border/80 bg-muted/40 p-1 shadow-inner backdrop-blur-sm dark:bg-muted/25 sm:max-w-84">
        <div
          className={cn(
            "pointer-events-none absolute top-1 bottom-1 rounded-full bg-card shadow-md ring-1 ring-border/50 transition-[left,right] duration-300 ease-out dark:bg-card/95",
            value === "monthly" ? "left-1 right-[calc(50%+2px)]" : "left-[calc(50%+2px)] right-1"
          )}
          aria-hidden
        />
        <button
          type="button"
          role="radio"
          aria-checked={value === "monthly"}
          className={cn(
            "relative z-10 flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors",
            value === "monthly" ? "text-foreground" : "text-muted-foreground hover:text-foreground/90"
          )}
          onClick={() => onChange("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === "annual"}
          className={cn(
            "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-sm font-semibold transition-colors sm:gap-2",
            value === "annual" ? "text-foreground" : "text-muted-foreground hover:text-foreground/90"
          )}
          onClick={() => onChange("annual")}
        >
          <span>Annual</span>
          <span
            className={cn(
              "whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide sm:px-2 sm:text-[10px]",
              value === "annual"
                ? "bg-tertiary/15 text-tertiary dark:text-tertiary"
                : "bg-background/80 text-muted-foreground ring-1 ring-border/40"
            )}
          >
            1 mo free
          </span>
        </button>
      </div>
      <p className="text-balance text-center text-xs text-muted-foreground sm:text-sm">
        Annual plans bill once per year and include one month free compared to monthly billing.
      </p>
    </div>
  )
}

function PriceBlock({
  plan,
  featured,
  billing,
  market,
}: {
  plan: PricingPlan
  featured?: boolean
  billing: PricingBillingCycle
  market: MarketId
}) {
  const theme = THEME[plan.theme]

  if (plan.monthlyUsd === null) {
    return (
      <div className="space-y-1">
        <p
          className={cn(
            "font-bold tracking-tight",
            featured ? "text-4xl md:text-[2.75rem]" : "text-3xl",
            theme.accentText
          )}
        >
          Free
        </p>
        <p className={cn("text-muted-foreground", featured ? "text-base" : "text-sm")}>Forever</p>
      </div>
    )
  }

  if (plan.monthlyUsd === undefined) {
    return (
      <div className="space-y-2">
        <div className="space-y-1">
          <p
            className={cn(
              "font-bold tracking-tight",
              featured ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl",
              theme.accentText
            )}
          >
            Custom
          </p>
          <p className={cn("text-muted-foreground", featured ? "text-base" : "text-sm")}>
            Tailored to your service
          </p>
        </div>
        <p className="text-sm italic leading-snug text-muted-foreground">
          Talk to us about your package
        </p>
      </div>
    )
  }

  const monthly = (getPlanMonthlyPrice(plan, market) ?? plan.monthlyUsd) as number
  const currencyCode = getPricingCurrencyCode(market)
  const annualTotal = annualUsdTotal(monthly)
  const save = annualSavingsUsd(monthly)

  if (billing === "monthly") {
    return (
      <div className="space-y-2">
        <p
          className={cn(
            "font-bold tracking-tight",
            featured ? "text-4xl md:text-[2.75rem]" : "text-3xl",
            theme.accentText
          )}
        >
          {formatCurrencyAmount(monthly, currencyCode)}
          <span
            className={cn(
              "font-semibold text-muted-foreground",
              featured ? "text-xl md:text-2xl" : "text-lg"
            )}
          >
            /mo
          </span>
        </p>
        <p className="text-sm italic leading-snug text-muted-foreground">
          Pay annually — 1 month free (save {formatCurrencyAmount(save, currencyCode)})
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p
        className={cn(
          "font-bold tracking-tight",
          featured ? "text-4xl md:text-[2.75rem]" : "text-3xl",
          theme.accentText
        )}
      >
        {formatCurrencyAmount(annualTotal, currencyCode)}
        <span
          className={cn(
            "font-semibold text-muted-foreground",
            featured ? "text-xl md:text-2xl" : "text-lg"
          )}
        >
          /yr
        </span>
      </p>
      <p className="text-sm leading-snug text-muted-foreground">
        <span className="font-medium text-foreground/90">1 month free</span>
        {" · "}
        save {formatCurrencyAmount(save, currencyCode)} vs monthly · billed once per year
      </p>
    </div>
  )
}

function ComparePriceCell({
  plan,
  billing,
  market,
}: {
  plan: PricingPlan
  billing: PricingBillingCycle
  market: MarketId
}) {
  if (plan.monthlyUsd === null) {
    return (
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="font-semibold text-foreground">Free</span>
        <span className="text-xs text-muted-foreground">Forever</span>
      </div>
    )
  }
  if (plan.monthlyUsd === undefined) {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-semibold text-foreground">Custom</span>
        <span className="max-w-40 text-[11px] italic leading-tight text-muted-foreground">
          Talk to us about your package
        </span>
      </div>
    )
  }
  const m = (getPlanMonthlyPrice(plan, market) ?? plan.monthlyUsd) as number
  const currencyCode = getPricingCurrencyCode(market)
  const save = annualSavingsUsd(m)
  if (billing === "monthly") {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-semibold text-foreground">
          {formatCurrencyAmount(m, currencyCode)}
          <span className="text-muted-foreground">/mo</span>
        </span>
        <span className="max-w-36 text-[11px] italic leading-tight text-muted-foreground">
          Pay annually — 1 month free (save {formatCurrencyAmount(save, currencyCode)})
        </span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="font-semibold text-foreground">
        {formatCurrencyAmount(annualUsdTotal(m), currencyCode)}
        <span className="text-muted-foreground">/yr</span>
      </span>
      <span className="max-w-36 text-[11px] leading-tight text-muted-foreground">
        1 month free · save {formatCurrencyAmount(save, currencyCode)}
      </span>
    </div>
  )
}

function FeatureCell({
  row,
  planId,
}: {
  row: FeatureRow
  planId: PlanId
}) {
  const raw = row[planId]
  const included = raw === true
  const detail = row.detail?.[planId]

  if (detail) {
    return (
      <div className="flex flex-col items-center gap-0.5 text-center">
        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="text-xs font-medium text-foreground">{detail}</span>
      </div>
    )
  }

  if (included) {
    return <Check className="mx-auto h-4 w-4 text-primary" aria-label="Included" />
  }

  return <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" />
}

function MobileFeatureValue({ row, planId }: { row: FeatureRow; planId: PlanId }) {
  const detail = row.detail?.[planId]
  const included = row[planId] === true

  if (detail) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        {detail}
      </span>
    )
  }

  if (included) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Included
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Minus className="h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden />
      Not included
    </span>
  )
}

export function PricingPageClient({ market }: { market: MarketId }) {
  const [billing, setBilling] = useState<PricingBillingCycle>("monthly")

  return (
    <div className="min-h-screen bg-background">
      <section className="relative isolate overflow-x-clip overflow-y-visible pb-12 pt-8 md:pb-16 md:pt-12 lg:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-linear-to-b from-primary/[0.07] via-background to-background" />
        <div className="pointer-events-none absolute -left-24 top-10 -z-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-0 -z-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10 text-center md:mb-12">
            <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-primary/15 bg-card/80 py-2 pl-3 pr-4 shadow-sm backdrop-blur-sm">
              <span className="text-xl leading-none" aria-hidden>
                ✨
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Twooky packages
              </span>
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Pricing that grows with your program
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              From a free directory presence to full marketing support, choose the package that fits your goals.
            </p>
            <BillingToggle value={billing} onChange={setBilling} />
          </div>

          <div className="mx-auto w-full overflow-visible px-1 py-4 md:px-2 md:py-6">
            <div
              className={cn(
                "grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-7",
                "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.22fr)_minmax(0,1fr)]",
                "xl:items-stretch xl:gap-7"
              )}
            >
              {PRICING_PLANS.map((plan) => {
                const theme = THEME[plan.theme]
                const isPopular = plan.badge === "Most Popular"
                const checkoutBillingPeriod = billing === "monthly" ? "monthly" : "yearly"

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-2xl border bg-card/90 py-0 shadow-sm backdrop-blur-sm transition-all duration-300",
                      "hover:-translate-y-0.5 hover:shadow-md",
                      isPopular
                        ? cn(
                            "z-10 rounded-3xl border-2 border-tertiary/35 shadow-2xl shadow-tertiary/20",
                            "ring-2 ring-tertiary/25 dark:border-tertiary/45 dark:ring-tertiary/20",
                            "md:scale-[1.03] xl:scale-[1.06]"
                          )
                        : "border-border/70"
                    )}
                  >
                    <div
                      className={cn(
                        theme.stripBg,
                        isPopular ? "h-2.5 shadow-[inset_0_-1px_0_var(--color-tertiary)]" : "h-1.5"
                      )}
                    />
                    {plan.badge && (
                      <div className="absolute right-3 top-4 md:right-4 md:top-5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1.5 rounded-full border-secondary/80 bg-secondary/12 px-3 py-1 text-xs font-semibold text-secondary shadow-sm",
                            "dark:border-secondary/70 dark:bg-secondary/20 dark:text-secondary",
                            isPopular && "tracking-wide"
                          )}
                        >
                          <Star
                            className="h-3.5 w-3.5 shrink-0 fill-secondary text-secondary"
                            aria-hidden
                          />
                          {plan.badge}
                        </Badge>
                      </div>
                    )}
                    <CardHeader
                      className={cn(
                        "space-y-1.5 pb-2 px-6 pt-8",
                        plan.badge && "pr-30 md:pr-32"
                      )}
                    >
                      <CardTitle
                        className={cn(
                          "font-bold tracking-tight",
                          isPopular ? "text-2xl md:text-[1.65rem]" : "text-xl",
                          theme.accentText
                        )}
                      >
                        {plan.name}
                      </CardTitle>
                      <CardDescription
                        className={cn(
                          "text-muted-foreground",
                          isPopular ? "text-base leading-snug" : "text-base"
                        )}
                      >
                        {plan.tagline}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col space-y-6 px-6 pb-6">
                      <div
                        className={cn(
                          "rounded-2xl border border-primary/12 dark:border-primary/20 px-4 py-4",
                          theme.softBg
                        )}
                      >
                        <PriceBlock plan={plan} featured={isPopular} billing={billing} market={market} />
                      </div>
                      <ul className="space-y-3 text-sm leading-snug text-muted-foreground">
                        {plan.highlights.map((h) => (
                          <li key={h.text} className="flex gap-2.5">
                            {h.exclusive ? (
                              <BadgeCheck
                                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                                aria-hidden
                              />
                            ) : (
                              <Check
                                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                                aria-hidden
                              />
                            )}
                            <span
                              className={cn(
                                h.exclusive && "font-medium text-foreground"
                              )}
                            >
                              {h.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="mt-auto border-t border-border/50 bg-muted/25 px-6 py-5">
                      {isPaidPlanId(plan.id) ? (
                        <StartCheckoutButton
                          planId={plan.id}
                          billingPeriod={checkoutBillingPeriod}
                          unauthenticatedHref="/for-providers"
                          className={cn(
                            "w-full rounded-xl font-semibold",
                            isPopular ? "h-12 text-base shadow-md" : "h-11"
                          )}
                          variant={isPopular ? "default" : "outline"}
                        >
                          {billing === "monthly" ? `Choose ${plan.name}` : `Choose ${plan.name} yearly`}
                        </StartCheckoutButton>
                      ) : (
                        <Button
                          className={cn(
                            "w-full rounded-xl font-semibold",
                            isPopular ? "h-12 text-base shadow-md" : "h-11"
                          )}
                          variant={isPopular ? "default" : "outline"}
                          asChild
                        >
                          <Link href={plan.ctaHref}>{plan.ctaLabel}</Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20 py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Compare all features
            </h2>
            <p className="mt-3 text-muted-foreground">
              A badge icon beside a feature means it is exclusive to KinderPath Pro.
            </p>
          </div>

          <div className="space-y-6 md:hidden">
            {PRICING_PLANS.map((plan) => (
              <Card key={`mobile-compare-${plan.id}`} className="overflow-hidden rounded-xl border border-border/80">
                <CardHeader className="space-y-1 border-b border-border/70 bg-muted/30 px-4 py-4">
                  <CardTitle className="text-lg font-semibold text-foreground">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">{plan.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 px-4 py-4">
                  <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {billing === "monthly" ? "Price (monthly)" : "Price (annual)"}
                    </p>
                    <div className="mt-2 text-sm">
                      <ComparePriceCell plan={plan} billing={billing} market={market} />
                    </div>
                  </div>

                  {FEATURE_CATEGORIES.map((category) => (
                    <div key={`mobile-${plan.id}-${category.title}`} className="space-y-2.5">
                      <div className="rounded-md border border-[#0BA5AA]/45 bg-[#0BA5AA]/14 px-3 py-2.5">
                        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">
                          {category.title}
                        </h3>
                      </div>
                      <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
                        {category.rows.map((row, index) => (
                          <div
                            key={`${plan.id}-${row.label}`}
                            className={cn(
                              "flex items-start justify-between gap-3 px-3 py-2.5",
                              index > 0 && "border-t border-border/55",
                              row.exclusive && "bg-primary/5"
                            )}
                          >
                            <span className="flex max-w-[58%] items-start gap-1.5 text-sm text-foreground">
                              {row.exclusive && (
                                <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                              )}
                              <span className={cn(row.exclusive && "font-medium")}>{row.label}</span>
                            </span>
                            <span className="shrink-0 text-right text-sm">
                              <MobileFeatureValue row={row} planId={plan.id} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border-2 border-border bg-card shadow-sm md:block">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm md:text-[0.9375rem]">
              <thead>
                <tr className="border-b-2 border-border bg-muted/50">
                  <th className="sticky left-0 z-2 border-r-2 border-border bg-muted/95 px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-foreground backdrop-blur-sm">
                    Feature
                  </th>
                  {PRICING_PLANS.map((p) => (
                    <th
                      key={p.id}
                      className="border-b-2 border-border px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-foreground"
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-muted/30">
                  <th
                    scope="row"
                    className="sticky left-0 z-2 border-r-2 border-b-2 border-border bg-muted/90 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm"
                  >
                    {billing === "monthly" ? "Price (monthly)" : "Price (annual)"}
                  </th>
                  {PRICING_PLANS.map((p) => (
                    <td key={p.id} className="border-b-2 border-border px-4 py-4 align-top">
                      <ComparePriceCell plan={p} billing={billing} market={market} />
                    </td>
                  ))}
                </tr>
                {FEATURE_CATEGORIES.map((cat) => (
                  <Fragment key={cat.title}>
                    <tr className="border-y-2 border-[#0BA5AA]/60 bg-[#0BA5AA]/14">
                      <td
                        colSpan={PLAN_IDS.length + 1}
                        className="sticky left-0 z-1 border-b-2 border-border bg-[#0BA5AA]/14 px-5 py-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary"
                      >
                        {cat.title}
                      </td>
                    </tr>
                    {cat.rows.map((row) => (
                      <tr
                        key={row.label}
                        className={cn(
                          "border-b-2 border-border/85 odd:bg-muted/12 transition-colors hover:bg-muted/20",
                          row.exclusive && "bg-primary/5"
                        )}
                      >
                        <td className="sticky left-0 z-1 max-w-56 border-r-2 border-b-2 border-border/85 bg-card/95 px-5 py-3 text-left text-foreground backdrop-blur-sm">
                          <span className="flex items-start gap-1.5">
                            {row.exclusive && (
                              <BadgeCheck
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                                aria-hidden
                              />
                            )}
                            <span className={cn(row.exclusive && "font-medium text-foreground")}>
                              {row.label}
                            </span>
                          </span>
                        </td>
                        {PLAN_IDS.map((pid) => (
                          <td key={pid} className="border-b-2 border-border/85 px-3 py-3 text-center">
                            <FeatureCell row={row} planId={pid} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
            {PRICING_FOOTNOTE}
          </p>
        </div>
      </section>
    </div>
  )
}
