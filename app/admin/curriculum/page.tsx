import { redirect } from "next/navigation"

export default function AdminCurriculumPage() {
  redirect("/admin/directory?tab=curriculum")
}
