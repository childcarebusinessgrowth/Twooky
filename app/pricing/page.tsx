import { AuthProviderClient } from "@/components/auth-provider-client"
import { PricingPageClient } from "@/components/pricing/pricing-page-client"

export const metadata = {
  title: "Pricing | Twooky",
  description:
    "Twooky packages for early learning providers: Sprout, Grow, Thrive, and KinderPath Pro. Compare listings, visibility, campaigns, and support.",
}

export default function PricingPage() {
  return (
    <AuthProviderClient>
      <PricingPageClient />
    </AuthProviderClient>
  )
}
