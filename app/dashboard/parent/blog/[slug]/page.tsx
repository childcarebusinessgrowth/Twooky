import { cache } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CalendarDays, Clock, ArrowRight } from "lucide-react"
import Image from "next/image"
import { RequireAuth } from "@/components/RequireAuth"
import { BlogArticleView, FullBleed } from "@/components/blogs/BlogArticleView"
import { getPublishedBlogBySlug, getRelatedPublishedBlogs, sanitizeBlogHtml } from "@/lib/blogs"

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 120

const getPublishedBlogBySlugCached = cache(async (slug: string) => {
  return getPublishedBlogBySlug(slug)
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const blog = await getPublishedBlogBySlugCached(slug)

  if (!blog) {
    return {
      title: "Article Not Found | Twooky",
      description: "The requested article could not be found.",
    }
  }

  return {
    title: `${blog.seoTitle || blog.title} | Twooky`,
    description: blog.metaDescription || blog.excerpt,
  }
}

export default async function ParentDashboardBlogArticlePage({ params }: PageProps) {
  const { slug } = await params
  const blog = await getPublishedBlogBySlugCached(slug)

  if (!blog) {
    return notFound()
  }

  const morePosts = await getRelatedPublishedBlogs(blog.slug, 3)
  const safeHtml = sanitizeBlogHtml(blog.contentHtml)

  const breadcrumbs = (
    <ol className="flex flex-wrap items-center gap-1 md:gap-1.5">
      <li>
        <Link href="/dashboard/parent" className="hover:text-foreground">
          Dashboard
        </Link>
      </li>
      <li className="text-muted-foreground/60">/</li>
      <li>
        <Link href="/dashboard/parent/blog" className="hover:text-foreground">
          Articles
        </Link>
      </li>
      <li className="text-muted-foreground/60">/</li>
      <li className="text-foreground line-clamp-1 max-w-[min(100%,12rem)] sm:max-w-md">{blog.title}</li>
    </ol>
  )

  return (
    <RequireAuth>
      <div className="space-y-0">
        <BlogArticleView blog={blog} safeHtml={safeHtml} breadcrumbs={breadcrumbs} compact />

        {morePosts.length > 0 && (
          <FullBleed className="border-t border-border/50 bg-muted/20">
            <section className="mx-auto max-w-6xl px-4 py-10 md:py-12 lg:px-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary/80">
                    Keep exploring
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                    More articles
                  </h2>
                </div>
                <Link
                  href="/dashboard/parent/blog"
                  className="hidden items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 md:inline-flex"
                >
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {morePosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/dashboard/parent/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/25 via-black/5 to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground">
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
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary md:text-base">
                        {post.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.excerpt}</p>
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <span>Read article</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 text-center md:hidden">
                <Link
                  href="/dashboard/parent/blog"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                >
                  View all articles
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </FullBleed>
        )}
      </div>
    </RequireAuth>
  )
}
