import { getPublishedBlogPreviews } from "@/lib/blogs"
import { BlogsPageClient } from "./pageClient"

export const revalidate = 120

export default async function BlogsPage() {
  const blogs = await getPublishedBlogPreviews()
  return <BlogsPageClient blogs={blogs} />
}

