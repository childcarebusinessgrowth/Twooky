import { redirect } from "next/navigation"

export default function AdminLanguagesPage() {
  redirect("/admin/directory?tab=languages")
}
