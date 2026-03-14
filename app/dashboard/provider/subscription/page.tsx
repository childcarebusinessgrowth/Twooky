"use client"

import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Free Listing",
    price: "$0",
    period: "forever",
    description: "Basic listing to get started",
    features: [
      "Basic profile page",
      "Up to 3 photos",
      "Receive inquiries",
      "Basic analytics",
    ],
    notIncluded: [
      "Featured placement",
      "Priority support",
      "Review responses",
      "Advanced analytics",
    ],
    current: false,
    popular: false,
  },
  {
    name: "Featured Listing",
    price: "$49",
    period: "per month",
    description: "Stand out from the competition",
    features: [
      "Everything in Free",
      "Featured badge",
      "Up to 10 photos",
      "Priority in search results",
      "Review responses",
      "Email support",
    ],
    notIncluded: [
      "Homepage placement",
      "Advanced analytics",
    ],
    current: false,
    popular: true,
  },
  {
    name: "Premium Profile",
    price: "$99",
    period: "per month",
    description: "Maximum visibility and features",
    features: [
      "Everything in Featured",
      "Homepage placement",
      "Unlimited photos",
      "Video gallery",
      "Advanced analytics",
      "Priority phone support",
      "Custom branding",
      "Social media integration",
    ],
    notIncluded: [],
    current: true,
    popular: false,
  },
]

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription plan and billing</p>
      </div>

      {/* Current plan banner */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-xl font-bold text-foreground">Premium Profile</p>
            <p className="text-sm text-muted-foreground">Renews on April 11, 2026</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Manage Billing</Button>
            <Button variant="outline">Cancel Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={cn(
              "relative border-border/50",
              plan.popular && "border-secondary shadow-lg",
              plan.current && "border-primary"
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-secondary text-secondary-foreground">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            {plan.current && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Current Plan</Badge>
              </div>
            )}

            <CardHeader className="pt-8">
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 shrink-0" />
                    <span className="line-through">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.current ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : plan.price === "$0" ? (
                <Button variant="outline" className="w-full">
                  Downgrade
                </Button>
              ) : (
                <Button 
                  className={cn(
                    "w-full",
                    plan.popular && "bg-secondary hover:bg-secondary/90"
                  )}
                >
                  Upgrade
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-1">Can I change plans anytime?</h4>
            <p className="text-sm text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">Is there a contract or commitment?</h4>
            <p className="text-sm text-muted-foreground">No long-term contracts. You can cancel your subscription at any time with no penalty.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
