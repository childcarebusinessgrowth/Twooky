import { redirect } from "next/navigation"
import WebsiteLanding from "@/components/provider/website-builder/website-landing"
import { isProviderWebsiteBuilderEnabled } from "@/lib/website-builder/feature-flag"

export default function ProviderWebsitePage() {
  if (!isProviderWebsiteBuilderEnabled()) {
    redirect("/dashboard/provider")
  }
  return <WebsiteLanding />
}
