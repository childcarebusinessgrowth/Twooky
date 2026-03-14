import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { CalendarDays, Clock, ArrowRight, Tag, Home as HomeIcon } from "lucide-react"
import { getPublishedBlogBySlug, getPublishedBlogs, sanitizeBlogHtml } from "@/lib/blogs"

type BlogPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params
  const blog = await getPublishedBlogBySlug(slug)

  if (!blog) {
    return {
      title: "Blog Not Found | Early Learning Directory",
      description: "The requested blog post could not be found.",
    }
  }

  return {
    title: `${blog.seoTitle || blog.title} | Early Learning Directory`,
    description: blog.metaDescription || blog.excerpt,
  }
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params
  const blog = await getPublishedBlogBySlug(slug)

  if (!blog) {
    return notFound()
  }

  const allBlogs = await getPublishedBlogs()
  const morePosts = allBlogs.filter((p) => p.slug !== blog.slug).slice(0, 3)
  const safeHtml = sanitizeBlogHtml(blog.contentHtml)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative border-b border-border/60 bg-linear-to-b from-primary/10 via-background to-background/80">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 lg:px-6 pt-10 pb-10 md:pb-14">
          <nav className="mb-6 text-xs md:text-sm text-muted-foreground">
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
              <li className="text-foreground line-clamp-1">
                {blog.title}
              </li>
            </ol>
          </nav>

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

              <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                {blog.excerpt}
              </p>
            </div>

            <div className="relative h-64 md:h-72 lg:h-80 w-full overflow-hidden rounded-3xl border border-border/60 shadow-lg">
              <Image
                src={blog.image}
                alt={blog.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/30 via-black/10 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-3xl px-4 lg:px-0">
          <article
            className="prose prose-sm md:prose-base lg:prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-primary-foreground/80 bg-linear-to-r from-primary/90 to-primary">
            <p className="font-semibold text-primary-foreground mb-1">
              Looking for childcare that fits your family?
            </p>
            <p className="text-primary-foreground/90">
              Use Early Learning Directory to compare verified programs, read real parent reviews,
              and contact providers directly—so your research turns into confident next steps.
            </p>
          </div>
        </div>
      </section>

      {/* More from the blog */}
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
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
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
    </div>
  )
}

