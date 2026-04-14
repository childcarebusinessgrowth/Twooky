"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

export type FilterOption = { value: string; label: string; tag?: string }

export type SearchFilterOptions = {
  ageGroups: FilterOption[]
  programTypes: FilterOption[]
  languages: FilterOption[]
  curriculum: FilterOption[]
  features: FilterOption[]
  /** Slug-to-name map for resolving program param; used internally by search page */
  programTypesBySlug?: Record<string, string>
  /** Currency symbol for tuition filter display (from DB) */
  currencySymbol?: string
}

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterState) => void
  filterOptions?: SearchFilterOptions
  className?: string
}

export interface FilterState {
  ageGroups: string[]
  programTypes: string[]
  tuitionRange: [number, number]
  languages: string[]
  features: string[]
  curriculumTypes: string[]
  availability: string[]
  minRating: number | null
}

export const DAILY_FEE_MIN = 20
export const DAILY_FEE_MAX = 300
const DAILY_FEE_STEP = 10

const STATIC_AGE_GROUPS: FilterOption[] = [
  { value: "Infant (0-12 months)", label: "Infant (0-12 months)" },
  { value: "Toddler (1-2 years)", label: "Toddler (1-2 years)" },
  { value: "Preschool (3-4 years)", label: "Preschool (3-4 years)" },
  { value: "Pre-K (4-5 years)", label: "Pre-K (4-5 years)" },
  { value: "School Age (5+)", label: "School Age (5+)" },
]

const STATIC_PROGRAM_TYPES: FilterOption[] = [
  { value: "Infant Care", label: "Infant Care" },
  { value: "Toddler Care", label: "Toddler Care" },
  { value: "Preschool", label: "Preschool" },
  { value: "Pre-K", label: "Pre-K" },
  { value: "Montessori", label: "Montessori" },
  { value: "Home Daycare", label: "Home Daycare" },
  { value: "After School", label: "After School" },
]

const STATIC_LANGUAGES: FilterOption[] = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "Mandarin", label: "Mandarin" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
]

const STATIC_FEATURES: FilterOption[] = [
  { value: "Meals Included", label: "Meals Included" },
  { value: "Outdoor Space", label: "Outdoor Space" },
  { value: "Special Needs Support", label: "Special Needs Support" },
  { value: "Transportation", label: "Transportation" },
  { value: "Flexible Hours", label: "Flexible Hours" },
  { value: "Security Cameras", label: "Security Cameras" },
]

const STATIC_CURRICULUM: FilterOption[] = [
  { value: "Montessori", label: "Montessori" },
  { value: "Play-Based", label: "Play-Based" },
  { value: "STEM-Focused", label: "STEM-Focused" },
  { value: "Academic", label: "Academic" },
  { value: "Reggio Emilia", label: "Reggio Emilia" },
]

const availabilityOptions = [
  { value: "openings", label: "Openings available" },
  { value: "waitlist", label: "Waitlist" },
  { value: "full", label: "Currently full" },
]

export function FilterSidebar({ onFilterChange, filterOptions, className = "" }: FilterSidebarProps) {
  const ageGroupOptions = (filterOptions?.ageGroups?.length ? filterOptions.ageGroups : STATIC_AGE_GROUPS) as FilterOption[]
  const programTypeOptions = (filterOptions?.programTypes?.length ? filterOptions.programTypes : STATIC_PROGRAM_TYPES) as FilterOption[]
  const languageOptions = (filterOptions?.languages?.length ? filterOptions.languages : STATIC_LANGUAGES) as FilterOption[]
  const curriculumOptions = (filterOptions?.curriculum?.length ? filterOptions.curriculum : STATIC_CURRICULUM) as FilterOption[]
  const featureOptions = (filterOptions?.features?.length ? filterOptions.features : STATIC_FEATURES) as FilterOption[]

  const [filters, setFilters] = useState<FilterState>({
    ageGroups: [],
    programTypes: [],
    tuitionRange: [DAILY_FEE_MIN, DAILY_FEE_MAX],
    languages: [],
    features: [],
    curriculumTypes: [],
    availability: [],
    minRating: null,
  })

  const updateFilter = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const toggleArrayFilter = (
    key: "ageGroups" | "programTypes" | "languages" | "features" | "curriculumTypes" | "availability",
    value: string,
  ) => {
    const current = filters[key]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    updateFilter(key, updated)
  }

  const clearFilters = () => {
    const cleared: FilterState = {
      ageGroups: [],
      programTypes: [],
      tuitionRange: [DAILY_FEE_MIN, DAILY_FEE_MAX],
      languages: [],
      features: [],
      curriculumTypes: [],
      availability: [],
      minRating: null,
    }
    setFilters(cleared)
    onFilterChange?.(cleared)
  }

  const activeFilterCount = 
    filters.ageGroups.length + 
    filters.programTypes.length + 
    filters.languages.length + 
    filters.features.length +
    filters.curriculumTypes.length +
    filters.availability.length +
    (filters.tuitionRange[0] !== DAILY_FEE_MIN || filters.tuitionRange[1] !== DAILY_FEE_MAX ? 1 : 0) +
    (filters.minRating ? 1 : 0)

  return (
    <aside className={`bg-card rounded-xl border border-border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-foreground">Filters</h2>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Age Groups */}
        <FilterSection title="Age Groups">
          <div className="space-y-3">
            {ageGroupOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`age-${option.value}`}
                  checked={filters.ageGroups.includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter("ageGroups", option.value)}
                />
                <Label htmlFor={`age-${option.value}`} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Daily Fee Range */}
        <FilterSection title="Daily Fee">
          <div className="pt-2 px-1">
            <Slider
              value={filters.tuitionRange}
              min={DAILY_FEE_MIN}
              max={DAILY_FEE_MAX}
              step={DAILY_FEE_STEP}
              onValueChange={(value) => updateFilter('tuitionRange', value as [number, number])}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{(filterOptions?.currencySymbol ?? "$")}{filters.tuitionRange[0]}</span>
              <span>{(filterOptions?.currencySymbol ?? "$")}{filters.tuitionRange[1]}</span>
            </div>
          </div>
        </FilterSection>

        {/* Program Types */}
        <FilterSection title="Program Type">
          <div className="space-y-3">
            {programTypeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`program-${option.value}`}
                  checked={filters.programTypes.includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter("programTypes", option.value)}
                />
                <Label htmlFor={`program-${option.value}`} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Languages */}
        <FilterSection title="Languages">
          <div className="flex flex-wrap gap-2">
            {languageOptions.map((option) => (
              <Badge
                key={option.value}
                variant={filters.languages.includes(option.value) ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter("languages", option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </FilterSection>

        {/* Curriculum / Philosophy */}
        <FilterSection title="Curriculum / Philosophy">
          <div className="space-y-3">
            {curriculumOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`curriculum-${option.value}`}
                  checked={filters.curriculumTypes.includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter("curriculumTypes", option.value)}
                />
                <Label htmlFor={`curriculum-${option.value}`} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Availability */}
        <FilterSection title="Availability" defaultOpen={false}>
          <div className="space-y-3">
            {availabilityOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`availability-${option.value}`}
                  checked={filters.availability.includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter("availability", option.value)}
                />
                <Label htmlFor={`availability-${option.value}`} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>

        {/* Minimum Rating */}
        <FilterSection title="Minimum Rating" defaultOpen={false}>
          <div className="pt-2 px-1 space-y-3">
            <Slider
              value={[filters.minRating ?? 4]}
              min={3}
              max={5}
              step={0.5}
              onValueChange={(value) => updateFilter("minRating", value[0])}
              className="mb-2"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{(filters.minRating ?? 4).toFixed(1)}+</span>
              {filters.minRating && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => updateFilter("minRating", null)}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </FilterSection>

        {/* Features */}
        <FilterSection title="Features" defaultOpen={false}>
          <div className="space-y-3">
            {featureOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`feature-${option.value}`}
                  checked={filters.features.includes(option.value)}
                  onCheckedChange={() => toggleArrayFilter("features", option.value)}
                />
                <Label htmlFor={`feature-${option.value}`} className="text-sm font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>
      </div>
    </aside>
  )
}

function FilterSection({ 
  title, 
  children, 
  defaultOpen = true 
}: { 
  title: string
  children: React.ReactNode
  defaultOpen?: boolean 
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
