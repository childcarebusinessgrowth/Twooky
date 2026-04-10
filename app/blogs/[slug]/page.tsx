import { cache } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CalendarDays, Clock, ArrowRight, Home as HomeIcon } from "lucide-react"
import { BlogArticleView } from "@/components/blogs/BlogArticleView"
import { getPublishedBlogBySlug, getRelatedPublishedBlogs, sanitizeBlogHtml } from "@/lib/blogs"

type BlogPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 120

const getPublishedBlogBySlugCached = cache(async (slug: string) => {
  return getPublishedBlogBySlug(slug)
})

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params
  const blog = await getPublishedBlogBySlugCached(slug)

  if (!blog) {
    return {
      title: "Blog Not Found | Twooky",
      description: "The requested blog post could not be found.",
    }
  }

  return {
    title: `${blog.seoTitle || blog.title} | Twooky`,
    description: blog.metaDescription || blog.excerpt,
  }
}

export default async function BlogPage({ params }: BlogPageProps) {
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
        <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <HomeIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span>Home</span>
        </Link>
      </li>
      <li className="text-muted-foreground/60">/</li>
      <li>
        <Link href="/blogs" className="hover:text-foreground">
          Blogs
        </Link>
      </li>
      <li className="text-muted-foreground/60">/</li>
      <li className="text-foreground line-clamp-1">{blog.title}</li>
    </ol>
  )

  return (
    <>
      <BlogArticleView blog={blog} safeHtml={safeHtml} breadcrumbs={breadcrumbs} />

      {morePosts.length > 0 && (
        <section className="pb-14 md:pb-18 lg:pb-20">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary/80">
                  Keep exploring
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                  More from the blog
                </h2>
              </div>
              <Link
                href="/blogs"
                className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                View all articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {morePosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blogs/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card hover:bg-background/80 shadow-sm hover:shadow-md transition-all duration-200"
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
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
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
                    <h3 className="text-sm md:text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
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
                href="/blogs"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                View all articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
