"use client"

import { Building2, MapPin, Clock, DollarSign, Image, HelpCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WizardStepHeader } from "../_components/WizardStepHeader"
import { Badge } from "@/components/ui/badge"
import { PROVIDER_TYPES } from "@/lib/provider-types"
import { AGE_GROUPS, AMENITIES } from "@/lib/listing-options"
import type { FaqItem, PhotoItem } from "../types"

type Step5ReviewSubmitProps = {
  businessName: string
  phone: string
  website: string
  description: string
  address: string
  city: string
  listingStatus: string
  featured: boolean
  providerTypes: string[]
  ageGroupsServed: string[]
  selectedCurriculum: string
  selectedLanguages: string[]
  amenities: string[]
  openingTime: string
  closingTime: string
  monthlyTuitionFrom: string
  monthlyTuitionTo: string
  totalCapacity: string
  virtualTourUrls: string[]
  faqs: FaqItem[]
  photoItems: PhotoItem[]
  curriculumOptions: { id: string; name: string }[]
}

function formatValue(value: string | undefined, fallback = "—") {
  return value?.trim() ? value : fallback
}

export function Step5ReviewSubmit({
  businessName,
  phone,
  website,
  description,
  address,
  city,
  listingStatus,
  featured,
  providerTypes,
  ageGroupsServed,
  selectedCurriculum,
  selectedLanguages,
  amenities,
  openingTime,
  closingTime,
  monthlyTuitionFrom,
  monthlyTuitionTo,
  totalCapacity,
  virtualTourUrls,
  faqs,
  photoItems,
  curriculumOptions,
}: Step5ReviewSubmitProps) {
  const providerTypeLabels = providerTypes
    .map((id) => PROVIDER_TYPES.find((t) => t.id === id)?.label)
    .filter(Boolean)
  const ageGroupLabels = ageGroupsServed
    .map((id) => AGE_GROUPS.find((g) => g.id === id)?.label)
    .filter(Boolean)
  const amenityLabels = amenities
    .map((id) => AMENITIES.find((a) => a.id === id)?.label)
    .filter(Boolean)
  const validVirtualTours = virtualTourUrls.filter((u) => u.trim())
  const validFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim())

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Review and Submit"
        description="Confirm the details below before creating the provider listing."
      />

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium">{formatValue(businessName)}</p>
          {phone && <p className="text-muted-foreground">{phone}</p>}
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {website}
            </a>
          )}
          {description && <p className="line-clamp-3 text-muted-foreground">{description}</p>}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{formatValue(address)}</p>
          <p className="text-muted-foreground">{formatValue(city)}</p>
          <div className="flex flex-wrap gap-1 pt-2">
            <Badge variant="secondary">{listingStatus}</Badge>
            {featured && <Badge>Featured</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Program</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {providerTypeLabels.length > 0 && (
            <div>
              <span className="text-muted-foreground">Types: </span>
              {providerTypeLabels.join(", ")}
            </div>
          )}
          {ageGroupLabels.length > 0 && (
            <div>
              <span className="text-muted-foreground">Age groups: </span>
              {ageGroupLabels.join(", ")}
            </div>
          )}
          {selectedCurriculum && (
            <div>
              <span className="text-muted-foreground">Curriculum: </span>
              {curriculumOptions.find((c) => c.name === selectedCurriculum)?.name ?? selectedCurriculum}
            </div>
          )}
          {selectedLanguages.length > 0 && (
            <div>
              <span className="text-muted-foreground">Languages: </span>
              {selectedLanguages.join(", ")}
            </div>
          )}
          {amenityLabels.length > 0 && (
            <div>
              <span className="text-muted-foreground">Amenities: </span>
              {amenityLabels.join(", ")}
            </div>
          )}
          {!providerTypeLabels.length &&
            !ageGroupLabels.length &&
            !selectedCurriculum &&
            selectedLanguages.length === 0 &&
            !amenityLabels.length && (
              <p className="text-muted-foreground">No program details added.</p>
            )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {(openingTime || closingTime) && (
            <p>
              {formatValue(openingTime)} – {formatValue(closingTime)}
            </p>
          )}
          {(monthlyTuitionFrom || monthlyTuitionTo) && (
            <p>
              Tuition: {formatValue(monthlyTuitionFrom)} – {formatValue(monthlyTuitionTo)}
            </p>
          )}
          {totalCapacity && <p>Capacity: {totalCapacity}</p>}
          {!openingTime && !closingTime && !monthlyTuitionFrom && !monthlyTuitionTo && !totalCapacity && (
            <p className="text-muted-foreground">No operating details added.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-4 w-4" />
            Media
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {photoItems.length} photo{photoItems.length !== 1 ? "s" : ""}
          </p>
          {validVirtualTours.length > 0 && (
            <p>{validVirtualTours.length} virtual tour{validVirtualTours.length !== 1 ? "s" : ""}</p>
          )}
          {validFaqs.length > 0 && (
            <p className="flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              {validFaqs.length} FAQ{validFaqs.length !== 1 ? "s" : ""}
            </p>
          )}
          {photoItems.length === 0 && validVirtualTours.length === 0 && validFaqs.length === 0 && (
            <p className="text-muted-foreground">No media added.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
