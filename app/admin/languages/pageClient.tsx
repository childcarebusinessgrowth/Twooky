"use client"

import { Languages } from "lucide-react"
import { CatalogManager, type CatalogItem } from "@/components/admin/catalog-manager"
import { createLanguage, deleteLanguage, updateLanguage } from "./actions"

type LanguageRecord = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

type Props = {
  initialLanguages: LanguageRecord[]
}

export function AdminLanguagesPageClient({ initialLanguages }: Props) {
  const items: CatalogItem[] = initialLanguages.map((row) => ({
    id: row.id,
    name: row.name,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }))

  return (
    <CatalogManager
      icon={Languages}
      pageTitle="Languages"
      pageDescription="Configure language options shown for provider profiles."
      cardTitle="Languages"
      cardDescription="Manage language choices available throughout listing forms."
      singularLabel="language"
      addButtonLabel="Add Language"
      emptyStateMessage="No languages configured yet. Add your first language to get started."
      initialItems={items}
      createItem={async (input) =>
        createLanguage({
          name: input.name,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        })
      }
      updateItem={async (id, input) =>
        updateLanguage(id, {
          name: input.name,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        })
      }
      deleteItem={deleteLanguage}
    />
  )
}
