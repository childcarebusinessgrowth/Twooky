import { redirect } from "next/navigation"

export default function AdminAgeGroupsPage() {
  redirect("/admin/directory?tab=age-groups")
}
