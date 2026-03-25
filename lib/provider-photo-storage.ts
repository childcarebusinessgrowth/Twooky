import "server-only"

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"

const PROVIDER_PHOTOS_BUCKET = "provider-photos"

/** Delete all objects in the provider-photos bucket under the given profile id prefix. */
export async function deleteProviderPhotoStorage(profileId: string): Promise<void> {
  const supabase = getSupabaseAdminClient()
  const bucket = supabase.storage.from(PROVIDER_PHOTOS_BUCKET)

  const paths: string[] = []
  let offset = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await bucket.list(profileId, { limit: pageSize, offset })
    if (error) {
      const message = error.message?.toLowerCase?.() ?? ""
      if (message.includes("not found") || message.includes("not exist")) {
        return
      }
      throw new Error(error.message)
    }

    const items = data ?? []
    for (const item of items) {
      const fullPath = item.name ? `${profileId}/${item.name}` : profileId
      paths.push(fullPath)
    }

    if (items.length < pageSize) break
    offset += pageSize
  }

  if (paths.length === 0) return

  for (let i = 0; i < paths.length; i += 1000) {
    const batch = paths.slice(i, i + 1000)
    const { error } = await bucket.remove(batch)
    if (error) throw new Error(error.message)
  }
}

