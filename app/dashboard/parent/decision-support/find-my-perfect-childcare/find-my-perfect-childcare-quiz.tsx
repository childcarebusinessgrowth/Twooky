"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type CountryOption = {
  code: string
  name: string
}

type CityOption = {
  name: string
  countryCode: string
}

type QuizInitialValues = {
  country: string
  city: string
  ageGroup: string
  programType: string
  language: string
  minFee: string
  maxFee: string
}

type QuizFormProps = {
  countries: CountryOption[]
  cities: CityOption[]
  ageGroupOptions: Array<{ value: string; label: string }>
  programTypeOptions: Array<{ value: string; label: string }>
  languageOptions: Array<{ value: string; label: string }>
  currencySymbol: string
  initialValues: QuizInitialValues
  hasSubmitted: boolean
  resultCount: number
}

const ANY_VALUE = "__any"
const STEPS = [
  "Location",
  "Age Group",
  "Preferences",
  "Budget",
] as const
const STEP_TITLES = [
  "Where do you need childcare?",
  "What age should we optimize for?",
  "Any learning preferences?",
  "What budget works for you?",
] as const
const STEP_HELPERS = [
  "We use this to show nearby providers in your exact area.",
  "Age fit strongly influences program availability.",
  "Optional, but helpful for better-quality recommendations.",
  "You can leave this open if you are still exploring.",
] as const

export function FindMyPerfectChildcareQuiz({
  countries,
  cities,
  ageGroupOptions,
  programTypeOptions,
  languageOptions,
  currencySymbol,
  initialValues,
  hasSubmitted,
  resultCount,
}: QuizFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentSearchParams = useSearchParams()

  const [country, setCountry] = useState(initialValues.country)
  const [city, setCity] = useState(initialValues.city)
  const [ageGroup, setAgeGroup] = useState(initialValues.ageGroup)
  const [programType, setProgramType] = useState(initialValues.programType)
  const [language, setLanguage] = useState(initialValues.language)
  const [minFee, setMinFee] = useState(initialValues.minFee)
  const [maxFee, setMaxFee] = useState(initialValues.maxFee)
  const [stepIndex, setStepIndex] = useState(() => {
    if (initialValues.country && initialValues.city && initialValues.ageGroup) {
      return STEPS.length - 1
    }
    if (initialValues.country && initialValues.city) {
      return 1
    }
    return 0
  })

  const availableCities = useMemo(() => {
    if (!country) return []
    return cities.filter((option) => option.countryCode === country)
  }, [cities, country])

  const canSubmit = Boolean(country && city && ageGroup)
  const progressValue = ((stepIndex + 1) / STEPS.length) * 100
  const currentStepTitle = STEP_TITLES[stepIndex]
  const currentStepHelper = STEP_HELPERS[stepIndex]

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const params = new URLSearchParams(currentSearchParams?.toString() ?? "")
    params.set("country", country)
    params.set("city", city)
    params.set("ageGroup", ageGroup)

    if (programType) params.set("programType", programType)
    else params.delete("programType")

    if (language) params.set("language", language)
    else params.delete("language")

    const parsedMinFee = Number(minFee)
    const parsedMaxFee = Number(maxFee)
    const hasMinFee = minFee !== "" && Number.isFinite(parsedMinFee)
    const hasMaxFee = maxFee !== "" && Number.isFinite(parsedMaxFee)

    if (hasMinFee) params.set("minFee", String(parsedMinFee))
    else params.delete("minFee")

    if (hasMaxFee) params.set("maxFee", String(parsedMaxFee))
    else params.delete("maxFee")

    if (hasMinFee && hasMaxFee && parsedMinFee > parsedMaxFee) {
      params.set("minFee", String(parsedMaxFee))
      params.set("maxFee", String(parsedMinFee))
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleCountryChange = (value: string) => {
    setCountry(value)
    const cityExistsInCountry = cities.some((option) => option.countryCode === value && option.name === city)
    if (!cityExistsInCountry) {
      setCity("")
    }
  }

  const handleReset = () => {
    setCountry("")
    setCity("")
    setAgeGroup("")
    setProgramType("")
    setLanguage("")
    setMinFee("")
    setMaxFee("")
    setStepIndex(0)
    router.push(pathname)
  }

  const canMoveNext =
    stepIndex === 0 ? Boolean(country && city) : stepIndex === 1 ? Boolean(ageGroup) : true
  const isStepUnlocked = (index: number): boolean => {
    if (index === 0) return true
    if (index === 1) return Boolean(country && city)
    if (index === 2) return Boolean(country && city && ageGroup)
    if (index === 3) return Boolean(country && city && ageGroup)
    return false
  }

  const nextStep = () => {
    if (!canMoveNext) return
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const prevStep = () => {
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Find My Perfect Childcare
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer a few quick questions and get tailored provider matches.
          </p>
        </div>
        {hasSubmitted ? (
          <Badge variant="secondary" className="text-sm">
            {resultCount} matches
          </Badge>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Question {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex]}
            </p>
            <p className="text-xs text-muted-foreground">{Math.round(progressValue)}% complete</p>
          </div>
          <Progress value={progressValue} />
          <div className="grid grid-cols-2 gap-2 pt-1 md:grid-cols-4">
            {STEPS.map((step, index) => {
              const active = index === stepIndex
              const unlocked = isStepUnlocked(index)
              return (
                <Button
                  key={step}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  disabled={!unlocked}
                  onClick={() => setStepIndex(index)}
                  className="justify-start"
                >
                  {index + 1}. {step}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-5">
          <div className="mb-4 border-b border-border/60 pb-3">
            <p className="text-base font-semibold text-foreground">{currentStepTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentStepHelper}</p>
          </div>

          {stepIndex === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quiz-country">Which country are you looking in?</Label>
                <Select value={country} onValueChange={handleCountryChange}>
                  <SelectTrigger id="quiz-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-city">Which city do you prefer?</Label>
                <Select
                  value={city || ANY_VALUE}
                  onValueChange={(value) => setCity(value === ANY_VALUE ? "" : value)}
                >
                  <SelectTrigger id="quiz-city">
                    <SelectValue placeholder={country ? "Select city" : "Choose country first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_VALUE}>
                      {country ? "Select city" : "Choose country first"}
                    </SelectItem>
                    {availableCities.map((option) => (
                      <SelectItem key={`${option.countryCode}-${option.name}`} value={option.name}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {stepIndex === 1 ? (
            <div className="space-y-2">
              <Label htmlFor="quiz-age">How old is your child?</Label>
              <Select value={ageGroup || ANY_VALUE} onValueChange={(value) => setAgeGroup(value === ANY_VALUE ? "" : value)}>
                <SelectTrigger id="quiz-age">
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>Select age group</SelectItem>
                  {ageGroupOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {stepIndex === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quiz-program">Preferred program type (optional)</Label>
                <Select
                  value={programType || ANY_VALUE}
                  onValueChange={(value) => setProgramType(value === ANY_VALUE ? "" : value)}
                >
                  <SelectTrigger id="quiz-program">
                    <SelectValue placeholder="Any program type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_VALUE}>Any program type</SelectItem>
                    {programTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-language">Preferred language (optional)</Label>
                <Select
                  value={language || ANY_VALUE}
                  onValueChange={(value) => setLanguage(value === ANY_VALUE ? "" : value)}
                >
                  <SelectTrigger id="quiz-language">
                    <SelectValue placeholder="Any language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY_VALUE}>Any language</SelectItem>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {stepIndex === 3 ? (
            <div className="space-y-2">
              <Label>What is your budget range? ({currencySymbol}, optional)</Label>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  type="number"
                  min={0}
                  step={50}
                  value={minFee}
                  onChange={(event) => setMinFee(event.target.value)}
                  placeholder="Minimum"
                  aria-label="Minimum budget"
                />
                <Input
                  type="number"
                  min={0}
                  step={50}
                  value={maxFee}
                  onChange={(event) => setMaxFee(event.target.value)}
                  placeholder="Maximum"
                  aria-label="Maximum budget"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" size="sm" variant="outline" onClick={() => { setMinFee("500"); setMaxFee("1200") }}>
                  Budget-friendly
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setMinFee("1200"); setMaxFee("2200") }}>
                  Mid-range
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setMinFee("2200"); setMaxFee("4000") }}>
                  Premium
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setMinFee(""); setMaxFee("") }}>
                  No budget limit
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-dashed border-border bg-background/50 p-4">
          <p className="text-sm font-semibold text-foreground">Your quiz summary</p>
          <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <p>Location: {country && city ? `${city}, ${country}` : "Not set yet"}</p>
            <p>Age group: {ageGroup || "Not set yet"}</p>
            <p>Program: {programType || "Any"}</p>
            <p>Language: {language || "Any"}</p>
            <p>Budget: {minFee || maxFee ? `${currencySymbol}${minFee || "0"} - ${currencySymbol}${maxFee || "Any"}` : "Any"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={prevStep} disabled={stepIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset quiz
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep} disabled={!canMoveNext} className="ml-auto">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={!canSubmit} className="ml-auto">
              See my matches
            </Button>
          )}
        </div>
        {!canMoveNext && stepIndex === 0 ? (
          <p className="text-xs text-muted-foreground">Select both country and city to continue.</p>
        ) : null}
        {!canMoveNext && stepIndex === 1 ? (
          <p className="text-xs text-muted-foreground">Choose an age group to continue.</p>
        ) : null}
      </form>
    </section>
  )
}
