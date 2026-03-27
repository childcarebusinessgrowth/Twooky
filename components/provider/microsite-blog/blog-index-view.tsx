import Image from "next/image"
import Link from "next/link"
import { CalendarDays, ChevronRight, Clock, Newspaper } from "lucide-react"
import type { ThemeTokens } from "@/lib/website-builder/types"
import type { ProviderMicrositeBlogListItem } from "@/lib/provider-microsite-blog"
import { cn } from "@/lib/utils"

const FALLBACK = "/images/blogs/quality-early-learning.svg"

type Props = {
  siteBase: string
  posts: ProviderMicrositeBlogListItem[]
  tokens: ThemeTokens
}

export function MicrositeBlogIndexView({ siteBase, posts, tokens }: Props) {
  const headingFont = Boolean(tokens.headingFontFamily?.trim())

  return (
    <>
      <header className="relative overflow-hidden border-b border-border/40">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,color-mix(in_oklab,var(--microsite-primary)_18%,transparent),transparent)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--microsite-primary)_6%,transparent)_0%,transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 md:pb-16 md:pt-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground md:text-sm">
            <Link href={siteBase} className="hover:text-[color:var(--microsite-primary)] transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            <span className="font-medium text-foreground">Blog</span>
          </nav>
          <div className="max-w-2xl">
            <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--microsite-primary)]">
              Journal
            </span>
            <h1
              className={cn(
                "text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
                headingFont && "font-[family-name:var(--microsite-heading-font)]",
              )}
            >
              Stories &amp; updates
            </h1>
            <p className="mt-3 text-base text-muted-foreground md:text-lg">
              Tips, news, and articles from our team for families and caregivers.
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 md:py-14 lg:px-8">
        {posts.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border/80 bg-muted/30 px-8 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:color-mix(in_oklab,var(--microsite-primary)_12%,transparent)]">
              <Newspaper className="h-7 w-7 text-[color:var(--microsite-primary)]" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold text-foreground">No posts yet</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              New articles will appear here when they are published. Check back soon.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`${siteBase}/blog/${encodeURIComponent(post.slug)}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_oklab,var(--microsite-primary)_35%,transparent)] hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    <Image
                      src={post.cover_image_url || FALLBACK}
                      alt={post.cover_image_alt || post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/90 backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2
                      className={cn(
                        "line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-[color:var(--microsite-primary)]",
                        headingFont && "font-[family-name:var(--microsite-heading-font)]",
                      )}
                    >
                      {post.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{post.excerpt}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/50 pt-4 text-xs text-muted-foreground">
                      {post.published_at ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(post.published_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.reading_time}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
