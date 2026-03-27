import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, CalendarDays, Clock } from "lucide-react"
import type { ThemeTokens } from "@/lib/website-builder/types"
import type { ProviderMicrositeBlogPost } from "@/lib/provider-microsite-blog"
import { cn } from "@/lib/utils"

const FALLBACK = "/images/blogs/quality-early-learning.svg"

type Props = {
  siteBase: string
  post: ProviderMicrositeBlogPost
  safeHtml: string
  tokens: ThemeTokens
}

export function MicrositeBlogPostView({ siteBase, post, safeHtml, tokens }: Props) {
  const headingFont = Boolean(tokens.headingFontFamily?.trim())
  const coverSrc = post.cover_image_url || FALLBACK

  return (
    <article className="relative">
      <nav
        aria-label="Breadcrumb"
        className="absolute left-0 right-0 top-0 z-20 flex flex-wrap items-center gap-1 px-4 py-4 text-xs text-white/90 md:px-8 md:text-sm"
      >
        <Link href={siteBase} className="hover:text-white transition-colors">
          Home
        </Link>
        <span className="opacity-60" aria-hidden>
          /
        </span>
        <Link href={`${siteBase}/blog`} className="hover:text-white transition-colors">
          Blog
        </Link>
        <span className="opacity-60" aria-hidden>
          /
        </span>
        <span className="line-clamp-1 max-w-[12rem] font-medium text-white md:max-w-md">{post.title}</span>
      </nav>

      <header className="relative min-h-[min(70vh,520px)] w-full">
        <div className="absolute inset-0">
          <Image
            src={coverSrc}
            alt={post.cover_image_alt || post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-black/50" />
          <div className="absolute inset-0 bg-black/35" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[min(70vh,520px)] max-w-4xl flex-col justify-end px-4 pb-12 pt-24 md:px-8 md:pb-16 md:pt-28">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-md"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1
            className={cn(
              "mt-4 text-3xl font-bold leading-[1.15] tracking-tight text-white drop-shadow-sm md:text-4xl lg:text-5xl",
              headingFont && "font-[family-name:var(--microsite-heading-font)]",
            )}
          >
            {post.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/90 md:text-lg">{post.excerpt}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/85">
            {post.published_at ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" />
                {new Date(post.published_at).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0" />
              {post.reading_time}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        <div
          className={cn(
            "prose prose-lg prose-neutral max-w-none dark:prose-invert",
            "prose-headings:scroll-mt-24 prose-headings:font-semibold",
            "prose-a:text-[color:var(--microsite-primary)] prose-a:no-underline hover:prose-a:underline",
            "prose-img:rounded-xl prose-blockquote:border-l-[color:var(--microsite-primary)]",
            headingFont && "prose-headings:font-[family-name:var(--microsite-heading-font)]",
          )}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        <div className="mt-12 border-t border-border/60 pt-8">
          <Link
            href={`${siteBase}/blog`}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-[color:color-mix(in_oklab,var(--microsite-primary)_40%,transparent)] hover:text-[color:var(--microsite-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all posts
          </Link>
        </div>
      </div>
    </article>
  )
}
