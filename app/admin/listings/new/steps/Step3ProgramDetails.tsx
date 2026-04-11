"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WizardStepHeader } from "../_components/WizardStepHeader"
import { PROVIDER_TYPES } from "@/lib/provider-types"
import { AMENITIES } from "@/lib/listing-options"
import type {
  AdminProviderAgeGroupOption,
  AdminProviderCurriculumOption,
  AdminProviderLanguageOption,
} from "../actions"

type Step3ProgramDetailsProps = {
  providerTypes: string[]
  setProviderTypes: (v: string[]) => void
  ageGroupsServed: string[]
  setAgeGroupsServed: (v: string[]) => void
  selectedCurriculumTypes: string[]
  setSelectedCurriculumTypes: (v: string[]) => void
  selectedLanguages: string[]
  setSelectedLanguages: (v: string[]) => void
  amenities: string[]
  setAmenities: (v: string[]) => void
  ageGroups: AdminProviderAgeGroupOption[]
  curriculum: AdminProviderCurriculumOption[]
  languages: AdminProviderLanguageOption[]
}

export function Step3ProgramDetails({
  providerTypes,
  setProviderTypes,
  ageGroupsServed,
  setAgeGroupsServed,
  selectedCurriculumTypes,
  setSelectedCurriculumTypes,
  selectedLanguages,
  setSelectedLanguages,
  amenities,
  setAmenities,
  ageGroups,
  curriculum,
  languages,
}: Step3ProgramDetailsProps) {
  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Program Details"
        description="Types of care, age groups, curriculum, and amenities."
      />

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Provider Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROVIDER_TYPES.map((type) => (
              <label key={type.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent p-3 transition-colors hover:bg-muted/50">
                <Checkbox
                  checked={providerTypes.includes(type.id)}
                  onCheckedChange={(checked) =>
                    setProviderTypes(
                      checked
                        ? providerTypes.includes(type.id)
                          ? providerTypes
                          : [...providerTypes, type.id]
                        : providerTypes.filter((id) => id !== type.id),
                    )
                  }
                />
                <span className="text-sm font-medium">{type.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Age Groups Served</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {ageGroups.map((group) => (
              <label key={group.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent p-3 transition-colors hover:bg-muted/50">
                <Checkbox
                  checked={ageGroupsServed.includes(group.tag)}
                  onCheckedChange={(checked) =>
                    setAgeGroupsServed(
                      checked
                        ? ageGroupsServed.includes(group.tag)
                          ? ageGroupsServed
                          : [...ageGroupsServed, group.tag]
                        : ageGroupsServed.filter((id) => id !== group.tag),
                    )
                  }
                />
                <span className="text-sm font-medium">{group.age_range}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Curriculum and Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Curriculum Type</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {curriculum.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent p-3 transition-colors hover:bg-muted/50">
                  <Checkbox
                    checked={selectedCurriculumTypes.includes(item.name)}
                    onCheckedChange={(checked) =>
                      setSelectedCurriculumTypes(
                        checked
                          ? selectedCurriculumTypes.includes(item.name)
                            ? selectedCurriculumTypes
                            : [...selectedCurriculumTypes, item.name]
                          : selectedCurriculumTypes.filter((c) => c !== item.name),
                      )
                    }
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Languages Spoken</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {languages.map((lang) => (
                <label key={lang.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent p-3 transition-colors hover:bg-muted/50">
                  <Checkbox
                    checked={selectedLanguages.includes(lang.name)}
                    onCheckedChange={(checked) =>
                      setSelectedLanguages(
                        checked
                          ? selectedLanguages.includes(lang.name)
                            ? selectedLanguages
                            : [...selectedLanguages, lang.name]
                          : selectedLanguages.filter((l) => l !== lang.name),
                      )
                    }
                  />
                  <span className="text-sm font-medium">{lang.name}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Amenities and Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {AMENITIES.map((amenity) => (
              <label key={amenity.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-transparent p-3 transition-colors hover:bg-muted/50">
                <Checkbox
                  checked={amenities.includes(amenity.id)}
                  onCheckedChange={(checked) =>
                    setAmenities(
                      checked
                        ? amenities.includes(amenity.id)
                          ? amenities
                          : [...amenities, amenity.id]
                        : amenities.filter((id) => id !== amenity.id),
                    )
                  }
                />
                <span className="text-sm font-medium">{amenity.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
