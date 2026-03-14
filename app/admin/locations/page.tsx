import { redirect } from "next/navigation"

export default function AdminLocationsPage() {
  redirect("/admin/directory?tab=locations")
}
