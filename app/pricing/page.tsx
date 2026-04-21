import { AuthProviderClient } from "@/components/auth-provider-client"
import { PricingPageClient } from "@/components/pricing/pricing-page-client"
import { getMarketFromCookies } from "@/lib/market-server"

export const metadata = {
  title: "Pricing | Twooky",
  description:
    "Twooky packages for early learning providers: Sprout, Grow, Thrive, and KinderPath Pro. Compare listings, visibility, campaigns, and support.",
}

export default async function PricingPage() {
  const market = await getMarketFromCookies()

  return (
    <AuthProviderClient>
      <PricingPageClient market={market} />
    </AuthProviderClient>
  )
}
