"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Clock, ArrowRight, Tag, Search, Sparkles } from "lucide-react"
import type { PublishedBlogListItem } from "@/lib/blogs"

type Props = {
  blogs: PublishedBlogListItem[]
}

export function ParentBlogHubClient({ blogs }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = useMemo(
    () => Array.from(new Set(blogs.flatMap((post) => post.tags))).sort(),
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
    <div className="space-y-8 lg:space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-linear-to-br from-primary/12 via-background to-secondary/10 px-5 py-8 md:px-8 md:py-10 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-8 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Twooky guides
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Articles for your childcare journey
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Guides, checklists, and tips from Twooky, search or pick a topic to find what helps you most.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/50 px-4 py-4 shadow-sm backdrop-blur-sm md:px-6 md:py-5">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, topic, or keyword"
              className="w-full rounded-full border border-border/60 bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-primary/20 placeholder:text-muted-foreground focus:border-primary focus:ring-2"
            />
          </div>
          {allTags.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Filter by topic</p>
              <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    activeTag === null
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  All topics
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      activeTag === tag
                        ? "border border-primary/60 bg-primary/10 text-primary"
                        : "border border-border/60 bg-background text-foreground hover:border-primary/40"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {filteredBlogs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">No articles match your search</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another keyword or clear the topic filter to see everything.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBlogs.map((post, index) => (
            <Link
              key={post.slug}
              href={`/dashboard/parent/blog/${post.slug}`}
              className="group flex h-full min-h-104 flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-all hover:border-primary/25 hover:shadow-md sm:min-h-112"
            >
              <div className="relative h-48 w-full shrink-0 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.imageAlt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/5 to-transparent" />
                <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm"
                    >
                      <Tag className="h-2.5 w-2.5 shrink-0 text-primary" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTime}
                  </span>
                </div>
                <h3 className="line-clamp-2 min-h-11 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 min-h-15 flex-1 text-sm text-muted-foreground">
                  {post.excerpt}
                </p>
                <div className="mt-auto pt-4">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
