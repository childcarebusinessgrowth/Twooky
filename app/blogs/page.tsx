import { getPublishedBlogs } from "@/lib/blogs"
import { BlogsPageClient } from "./pageClient"

export const dynamic = "force-dynamic"

export default async function BlogsPage() {
  const blogs = await getPublishedBlogs()
  return <BlogsPageClient blogs={blogs} />
}

