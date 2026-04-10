import Image from "next/image"
import type { ReactNode } from "react"
import { CalendarDays, Clock, Tag } from "lucide-react"
import type { PublishedBlog } from "@/lib/blogs"
import { cn } from "@/lib/utils"

const proseArticleClass =
  "prose prose-sm md:prose-base lg:prose-lg max-w-none min-w-0 break-words prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground [&_h1]:text-3xl [&_h1]:md:text-4xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_img]:max-w-full [&_img]:h-auto [&_iframe]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_a]:text-blue-600 [&_a]:underline [&_a]:decoration-blue-600/40 [&_a:hover]:text-blue-700 [&_a:hover]:decoration-blue-600"

/**
 * Breaks out of a centered max-width parent so backgrounds span the viewport.
 * Uses margin breakout instead of translate + w-screen so layout math stays correct
 * and avoids horizontal overflow from mis-centered 100vw strips.
 */
export function FullBleed({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "relative w-dvw max-w-dvw shrink-0 ml-[calc(50%-50dvw)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

type BlogArticleViewProps = {
  blog: PublishedBlog
  safeHtml: string
  breadcrumbs: ReactNode
  /** When true, hero uses compact padding for nested dashboard layout */
  compact?: boolean
}

export function BlogArticleView({ blog, safeHtml, breadcrumbs, compact }: BlogArticleViewProps) {
  if (compact) {
    return (
      <div className="min-h-0 min-w-0">
        <FullBleed className="border-b border-border/40 bg-background">
          <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-1 md:px-6 lg:px-8 lg:pb-12">
            <nav className="mb-8 text-xs text-muted-foreground md:text-sm">
              <div className="inline-flex max-w-full rounded-2xl border border-border/50 bg-card px-3 py-2 shadow-sm">
                {breadcrumbs}
              </div>
            </nav>

            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr),minmax(0,26rem)] lg:gap-10">
              <div className="min-w-0 space-y-5">
                {blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    {new Date(blog.publishedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    {blog.readingTime}
                  </span>
                </div>

                <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
                  {blog.title}
                </h1>

                <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                  {blog.excerpt}
                </p>
              </div>

              <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-border/50 bg-muted shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] lg:aspect-auto lg:min-h-68 lg:max-h-88">
                <Image
                  src={blog.image}
                  alt={blog.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 400px"
                  priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </FullBleed>

        <FullBleed className="bg-linear-to-b from-muted/[0.07] via-background to-background">
          <div className="relative mx-auto max-w-3xl min-w-0 px-4 py-12 md:px-6 md:py-16 lg:px-8">
            <article className={proseArticleClass} dangerouslySetInnerHTML={{ __html: safeHtml }} />

            <div className="mt-12 rounded-2xl border border-primary/15 bg-linear-to-br from-primary to-primary/90 px-5 py-5 text-sm shadow-lg shadow-primary/10">
              <p className="font-semibold text-primary-foreground">Looking for childcare that fits your family?</p>
              <p className="mt-1.5 text-primary-foreground/95">
                Use Twooky to compare verified programs, read real parent reviews, and contact providers
                directly, so your research turns into confident next steps.
              </p>
            </div>
          </div>
        </FullBleed>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative border-b border-border/60 bg-linear-to-b from-primary/10 via-background to-background/80 pt-10 pb-10 md:pb-14"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 lg:px-6">
          <nav className="mb-6 text-xs md:text-sm text-muted-foreground">{breadcrumbs}</nav>

          <div className="grid gap-8 lg:grid-cols-[3fr,2fr] items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(blog.publishedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <Clock className="h-3.5 w-3.5" />
                  {blog.readingTime}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
                {blog.title}
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-2xl">{blog.excerpt}</p>
            </div>

            <div className="relative h-64 md:h-72 lg:h-80 w-full overflow-hidden rounded-3xl border border-border/60 shadow-lg">
              <Image
                src={blog.image}
                alt={blog.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/30 via-black/10 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-3xl px-4 lg:px-0">
          <article className={proseArticleClass} dangerouslySetInnerHTML={{ __html: safeHtml }} />

          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-primary-foreground/80 bg-linear-to-r from-primary/90 to-primary">
            <p className="font-semibold text-primary-foreground mb-1">
              Looking for childcare that fits your family?
            </p>
            <p className="text-primary-foreground/90">
              Use Twooky to compare verified programs, read real parent reviews, and contact providers
              directly, so your research turns into confident next steps.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
