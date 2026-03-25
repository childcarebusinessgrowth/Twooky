import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { ParentsPageClient } from "./pageClient"

export type ParentProfile = {
  id: string
  email: string
  role: "parent" | "provider" | "admin"
  display_name: string | null
  country_name: string | null
  city_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type PageProps = {
  searchParams: Promise<{
    search?: string
  }>
}

export default async function AdminParentsPage({ searchParams }: PageProps) {
  let parents: ParentProfile[] = []
  let error: string | null = null
  const params = await searchParams
  const searchQuery = params.search?.trim() ?? ""

  try {
    const admin = getSupabaseAdminClient()
    const { data, error: fetchError } = await admin
      .from("profiles")
      .select("id, email, role, display_name, country_name, city_name, is_active, created_at, updated_at")
      .eq("role", "parent")
      .order("created_at", { ascending: false })

    if (fetchError) {
      error = fetchError.message
    } else if (data) {
      parents = data as ParentProfile[]
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load parents"
  }

  return (
    <ParentsPageClient
      initialParents={parents}
      loadError={error}
      initialSearch={searchQuery}
    />
  )
}
