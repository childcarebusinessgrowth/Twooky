import Link from "next/link"
import { redirect } from "next/navigation"
import WebsiteBuilderClient from "@/components/provider/website-builder/website-builder-client"
import { isProviderWebsiteBuilderEnabled } from "@/lib/website-builder/feature-flag"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LayoutTemplate } from "lucide-react"

export default function ProviderWebsiteBuildPage() {
  if (!isProviderWebsiteBuilderEnabled()) {
    redirect("/dashboard/provider")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-2">
          <div className="text-primary inline-flex items-center gap-2 text-sm font-medium">
            <LayoutTemplate className="h-4 w-4 shrink-0" />
            Website
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Site builder</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
            Drag blocks on the canvas, fine-tune them in the inspector, then publish when you are ready. Your live URL
            appears in the left panel after publishing.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 self-start" asChild>
          <Link href="/dashboard/provider/website">
            <ArrowLeft className="h-4 w-4" />
            Templates &amp; start
          </Link>
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <WebsiteBuilderClient />
      </div>
    </div>
  )
}
