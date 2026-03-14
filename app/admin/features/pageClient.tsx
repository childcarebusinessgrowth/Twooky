"use client"

import { ListChecks } from "lucide-react"
import { CatalogManager, type CatalogItem } from "@/components/admin/catalog-manager"
import { createFeature, deleteFeature, updateFeature } from "./actions"

type FeatureRecord = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

type Props = {
  initialFeatures: FeatureRecord[]
}

export function AdminFeaturesPageClient({ initialFeatures }: Props) {
  const items: CatalogItem[] = initialFeatures.map((row) => ({
    id: row.id,
    name: row.name,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }))

  return (
    <CatalogManager
      icon={ListChecks}
      pageTitle="Provider Features"
      pageDescription="Manage feature options providers can highlight on their listings."
      cardTitle="Provider Features"
      cardDescription="Control amenity and service highlights used in profile checklists."
      singularLabel="feature"
      addButtonLabel="Add Feature"
      emptyStateMessage="No provider features configured yet. Add your first feature to get started."
      initialItems={items}
      createItem={async (input) =>
        createFeature({
          name: input.name,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        })
      }
      updateItem={async (id, input) =>
        updateFeature(id, {
          name: input.name,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        })
      }
      deleteItem={deleteFeature}
    />
  )
}
