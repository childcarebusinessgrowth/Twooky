import { redirect } from "next/navigation"

export default function AdminProgramTypesPage() {
  redirect("/admin/directory?tab=program-types")
}
