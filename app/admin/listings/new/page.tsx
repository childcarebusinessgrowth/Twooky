import { guardRoleOrRedirect } from "@/lib/authzServer"
import { Card, CardContent } from "@/components/ui/card"
import { getAdminProviderCreateOptions } from "./actions"
import { AdminCreateProviderForm } from "./AdminCreateProviderForm"

export default async function AdminCreateProviderPage() {
  await guardRoleOrRedirect("admin")
  const { countries, cities, languages, curriculum, currencies, ageGroups, programTypes } = await getAdminProviderCreateOptions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Provider</h1>
        <p className="text-muted-foreground">
          Create a provider listing with full details, photos, and FAQs.
        </p>
      </div>
      <Card className="border-border/50">
        <CardContent className="px-6 py-6 lg:px-8">
          <AdminCreateProviderForm
            countries={countries}
            cities={cities}
            languages={languages}
            curriculum={curriculum}
            currencies={currencies}
            ageGroups={ageGroups}
            programTypes={programTypes}
          />
        </CardContent>
      </Card>
    </div>
  )
}
