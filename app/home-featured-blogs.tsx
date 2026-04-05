import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Clock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRecentPublishedBlogs } from "@/lib/blogs"

export function HomeFeaturedBlogsSectionSkeleton() {
  return (
    <section className="py-20 md:py-24 bg-muted/30" aria-busy="true">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="h-8 w-72 rounded bg-muted animate-pulse" />
            <div className="h-4 w-96 max-w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="h-48 w-full bg-muted/80 animate-pulse" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export async function HomeFeaturedBlogsSection() {
  const featuredBlogs = await getRecentPublishedBlogs(3)

  return (
    <section className="py-20 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-tertiary">
              From our blog
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight mb-2">
              Featured Articles for Parents
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Short, practical reads to help you compare programs, prepare for tours, and support big transitions.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/blogs">
                View all articles
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredBlogs.map((post) => (
            <Link
              key={post.slug}
              href={`/blogs/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card hover:bg-background/80 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/10 to-transparent" />
              </div>
              <div className="flex flex-1 flex-col p-4 md:p-5">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTime}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Parent guide
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-tertiary">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-tertiary">
                  <span>Read article</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
