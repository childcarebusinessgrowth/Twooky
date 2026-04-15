"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ChevronDown,
  ExternalLink,
  LayoutTemplate,
  Newspaper,
  Pencil,
} from "lucide-react"
import { getProviderWebsiteNavSummary } from "@/app/dashboard/provider/website/actions"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

const WEBSITE_BASE = "/dashboard/provider/website"

type Props = {
  onItemClick?: () => void
}

export function ProviderWebsiteNavSection({ onItemClick }: Props) {
  const pathname = usePathname()
  const inWebsiteSection = pathname.startsWith(WEBSITE_BASE)
  const [open, setOpen] = useState(inWebsiteSection)
  const [prevInWebsiteSection, setPrevInWebsiteSection] = useState(inWebsiteSection)
  const [summary, setSummary] = useState<{
    subdomain_slug: string
    published_version_id: string | null
  } | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Expand when navigating into the Website section (adjusting state during render when route changes).
  if (inWebsiteSection !== prevInWebsiteSection) {
    setPrevInWebsiteSection(inWebsiteSection)
    if (inWebsiteSection) {
      setOpen(true)
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await getProviderWebsiteNavSummary()
      if (cancelled) return
      if ("ok" in res && res.ok) {
        setSummary(res.summary)
      }
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const isPublished = Boolean(summary?.published_version_id)
  const rootDomain = (process.env.NEXT_PUBLIC_SITE_ROOT_DOMAIN ?? "").trim().toLowerCase()
  const sitePath =
    summary?.subdomain_slug != null && summary.subdomain_slug !== ""
      ? rootDomain
        ? `https://${summary.subdomain_slug}.${rootDomain}`
        : `/site/${encodeURIComponent(summary.subdomain_slug)}`
      : ""

  const parentActive = inWebsiteSection

  const subActive = (href: string, blogSection?: boolean) =>
    pathname === href || (blogSection === true && pathname.startsWith(`${WEBSITE_BASE}/blog`))

  const subLinkClass = (href: string, blogSection?: boolean) =>
    cn(
      "flex items-center gap-2 rounded-md py-2 pl-9 pr-3 text-sm font-medium transition-colors",
      subActive(href, blogSection)
        ? "bg-primary/15 text-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    )

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-0.5">
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
          parentActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <LayoutTemplate className="h-5 w-5 shrink-0" />
        <span className="flex-1">Website</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pt-0.5 data-[state=closed]:animate-none">
        <Link
          href={`${WEBSITE_BASE}/blog`}
          onClick={onItemClick}
          className={subLinkClass(`${WEBSITE_BASE}/blog`, true)}
        >
          <Newspaper className="h-4 w-4 shrink-0 opacity-80" />
          Blog
        </Link>
        <Link href={WEBSITE_BASE} onClick={onItemClick} className={subLinkClass(WEBSITE_BASE)}>
          <LayoutTemplate className="h-4 w-4 shrink-0 opacity-80" />
          Templates
        </Link>
        {loaded && isPublished && sitePath ? (
          <a
            href={sitePath}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onItemClick}
            className={subLinkClass(sitePath)}
          >
            <ExternalLink className="h-4 w-4 shrink-0 opacity-80" />
            View live site
          </a>
        ) : (
          <span
            title={
              !loaded
                ? undefined
                : !summary
                  ? "Create a site from Templates, then publish to get a public link."
                  : "Publish your site from the editor to share a live link."
            }
            className={cn(
              "flex cursor-not-allowed items-center gap-2 rounded-md py-2 pl-9 pr-3 text-sm font-medium text-muted-foreground/70",
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0 opacity-50" />
            View live site
          </span>
        )}
        <Link
          href={`${WEBSITE_BASE}/build`}
          onClick={onItemClick}
          className={subLinkClass(`${WEBSITE_BASE}/build`)}
        >
          <Pencil className="h-4 w-4 shrink-0 opacity-80" />
          Edit site
        </Link>
      </CollapsibleContent>
    </Collapsible>
  )
}
