"use client"

import { BookOpenText } from "lucide-react"
import { CatalogManager, type CatalogItem } from "@/components/admin/catalog-manager"
import { createCurriculum, deleteCurriculum, updateCurriculum } from "./actions"

type CurriculumRecord = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

type Props = {
  initialCurriculum: CurriculumRecord[]
}

export function AdminCurriculumPageClient({ initialCurriculum }: Props) {
  const items: CatalogItem[] = initialCurriculum.map((row) => ({
    id: row.id,
    name: row.name,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }))

  return (
    <CatalogManager
      icon={BookOpenText}
      pageTitle="Curriculum / Philosophy"
      pageDescription="Manage educational approaches displayed in provider profiles."
      cardTitle="Curriculum / Philosophy"
      cardDescription="Keep curriculum and philosophy choices consistent across the platform."
      singularLabel="curriculum option"
      addButtonLabel="Add Curriculum Option"
      emptyStateMessage="No curriculum options configured yet. Add your first option to get started."
      initialItems={items}
      createItem={async (input) =>
        createCurriculum({
          name: input.name,
          isActive: input.isActive,
        })
      }
      updateItem={async (id, input) =>
        updateCurriculum(id, {
          name: input.name,
          isActive: input.isActive,
        })
      }
      deleteItem={deleteCurriculum}
    />
  )
}
