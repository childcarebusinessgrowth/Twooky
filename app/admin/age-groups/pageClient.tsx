"use client"

import { Baby } from "lucide-react"
import { CatalogManager, type CatalogItem } from "@/components/admin/catalog-manager"
import { createAgeGroup, deleteAgeGroup, updateAgeGroup } from "./actions"

type AgeGroupRecord = {
  id: string
  name: string
  age_range: string | null
  sort_order: number
  is_active: boolean
}

type Props = {
  initialAgeGroups: AgeGroupRecord[]
}

export function AdminAgeGroupsPageClient({ initialAgeGroups }: Props) {
  const items: CatalogItem[] = initialAgeGroups.map((row) => ({
    id: row.id,
    name: row.name,
    sort_order: row.sort_order,
    is_active: row.is_active,
    secondary_value: row.age_range,
  }))

  return (
    <CatalogManager
      icon={Baby}
      pageTitle="Age Groups"
      pageDescription="Configure provider age groups used in listings and filters."
      cardTitle="Age Groups"
      cardDescription="Manage available age ranges for provider offerings."
      singularLabel="age group"
      addButtonLabel="Add Age Group"
      emptyStateMessage="No age groups configured yet. Add your first age group to get started."
      initialItems={items}
      secondaryField={{
        tableHeader: "Age range",
        formLabel: "Age range",
        placeholder: "0-12 months",
      }}
      createItem={async (input) =>
        createAgeGroup({
          name: input.name,
          ageRange: input.secondaryValue,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        })
      }
      updateItem={async (id, input) =>
        updateAgeGroup(id, {
          name: input.name,
          ageRange: input.secondaryValue,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        })
      }
      deleteItem={deleteAgeGroup}
    />
  )
}
