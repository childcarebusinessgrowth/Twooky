"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Clock, ArrowRight, Tag, Search } from "lucide-react"
import type { PublishedBlog } from "@/lib/blogs"

type Props = {
  blogs: PublishedBlog[]
}

export function BlogsPageClient({ blogs }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = useMemo(
    () => Array.from(new Set(blogs.flatMap((post) => post.tags))),
    [blogs],
  )

  const filteredBlogs = useMemo(
    () =>
      blogs.filter((post) => {
        const matchesTag = activeTag ? post.tags.includes(activeTag) : true

        if (!searchQuery.trim()) {
          return matchesTag
        }

        const haystack = (post.title + " " + post.excerpt + " " + post.tags.join(" ")).toLowerCase()
        const needle = searchQuery.toLowerCase()

        return matchesTag && haystack.includes(needle)
      }),
    [blogs, activeTag, searchQuery],
  )

  return (
    <div className="min-h-screen bg-background">
      <section className="py-14 md:py-18 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="max-w-2xl mb-8">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary/80">
              Early Learning Insights
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Browse the blog</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Explore guides, checklists, and real-life tips to help you feel calm and prepared at every stage of your childcare search.
            </p>
          </div>

          <section className="mb-8 rounded-2xl border border-border/70 bg-muted/40 px-4 py-4 md:px-6 md:py-5 shadow-sm">
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search articles"
                  className="w-full rounded-full border border-border/60 bg-background px-9 py-2 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground focus:border-primary focus:ring-2"
                />
              </div>
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTag(null)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      activeTag === null
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-background text-muted-foreground border border-border/60 hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    All topics
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        activeTag === tag
                          ? "bg-primary/10 text-primary border border-primary/60"
                          : "bg-background text-foreground border border-border/60 hover:border-primary/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {filteredBlogs.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No published articles match your filters yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBlogs.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blogs/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card hover:bg-background/80 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="relative h-52 w-full overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.imageAlt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/30 via-black/5 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm"
                        >
                          <Tag className="h-3 w-3 text-primary" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4 md:p-5">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(post.publishedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readingTime}
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
                    <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      <span>Read article</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
