import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getProviderPlanAccessForUser } from "@/lib/provider-plan-access"
import { isProviderWebsiteBuilderEnabled } from "@/lib/website-builder/feature-flag"

export default async function ProviderWebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isProviderWebsiteBuilderEnabled()) {
    redirect("/dashboard/provider")
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const access = await getProviderPlanAccessForUser(supabase, user.id)
    if (!access.canAccessWebsite) {
      redirect("/dashboard/provider/subscription")
    }
  }

  return <>{children}</>
}
