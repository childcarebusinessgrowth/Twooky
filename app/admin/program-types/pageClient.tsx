"use client"

import { GraduationCap } from "lucide-react"
import { CatalogManager, type CatalogItem } from "@/components/admin/catalog-manager"
import { createProgramType, deleteProgramType, updateProgramType } from "./actions"

type ProgramTypeRecord = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

type Props = {
  initialProgramTypes: ProgramTypeRecord[]
}

export function AdminProgramTypesPageClient({ initialProgramTypes }: Props) {
  const items: CatalogItem[] = initialProgramTypes.map((row) => ({
    id: row.id,
    name: row.name,
    sort_order: row.sort_order,
    is_active: row.is_active,
  }))

  return (
    <CatalogManager
      icon={GraduationCap}
      pageTitle="Program Types"
      pageDescription="Manage program categories used by providers across the directory."
      cardTitle="Program Types"
      cardDescription="Control the program type options shown in forms and filters."
      singularLabel="program type"
      addButtonLabel="Add Program Type"
      emptyStateMessage="No program types configured yet. Add your first program type to get started."
      initialItems={items}
      createItem={async (input) =>
        createProgramType({
          name: input.name,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        })
      }
      updateItem={async (id, input) =>
        updateProgramType(id, {
          name: input.name,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        })
      }
      deleteItem={deleteProgramType}
    />
  )
}
