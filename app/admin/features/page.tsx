import { redirect } from "next/navigation"

export default function AdminFeaturesPage() {
  redirect("/admin/directory?tab=features")
}
