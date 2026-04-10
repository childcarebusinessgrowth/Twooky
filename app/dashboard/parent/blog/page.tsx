import { RequireAuth } from "@/components/RequireAuth"
import { getPublishedBlogPreviews } from "@/lib/blogs"
import { ParentBlogHubClient } from "./ParentBlogHubClient"

export const revalidate = 120

export default async function ParentBlogHubPage() {
  const blogs = await getPublishedBlogPreviews()

  return (
    <RequireAuth>
      <div className="space-y-6 lg:space-y-8">
        <ParentBlogHubClient blogs={blogs} />
      </div>
    </RequireAuth>
  )
}
