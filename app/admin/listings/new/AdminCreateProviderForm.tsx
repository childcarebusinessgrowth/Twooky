"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type {
  AdminProviderAgeGroupOption,
  AdminProviderCityOption,
  AdminProviderCountryOption,
  AdminProviderCurriculumOption,
  AdminProviderCurrencyOption,
  AdminProviderLanguageOption,
  AdminProviderProgramTypeOption,
  AdminProviderTypeOption,
} from "./actions"
import { createAdminProvider } from "./actions"
import { WIZARD_STEPS, type WizardStepId } from "./types"
import { WizardProgress } from "./_components/WizardProgress"
import { WizardFooter } from "./_components/WizardFooter"
import { Step1Basics } from "./steps/Step1Basics"
import { Step2LocationVisibility } from "./steps/Step2LocationVisibility"
import { Step3ProgramDetails } from "./steps/Step3ProgramDetails"
import { Step4OperationsMedia } from "./steps/Step4OperationsMedia"
import { Step5ReviewSubmit } from "./steps/Step5ReviewSubmit"

function toFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export function AdminCreateProviderForm({
  countries,
  cities,
  languages,
  curriculum,
  currencies,
  ageGroups,
  programTypes,
  providerTypeOptions,
}: {
  countries: AdminProviderCountryOption[]
  cities: AdminProviderCityOption[]
  languages: AdminProviderLanguageOption[]
  curriculum: AdminProviderCurriculumOption[]
  currencies: AdminProviderCurrencyOption[]
  ageGroups: AdminProviderAgeGroupOption[]
  programTypes: AdminProviderProgramTypeOption[]
  providerTypeOptions: AdminProviderTypeOption[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState<WizardStepId>(1)
  const [error, setError] = useState<string | null>(null)

  const [businessName, setBusinessName] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [countryId, setCountryIdState] = useState("")
  const [cityId, setCityId] = useState("")
  const [listingStatus, setListingStatus] = useState("active")
  const [featured, setFeatured] = useState(false)
  const [openingTime, setOpeningTime] = useState("")
  const [closingTime, setClosingTime] = useState("")
  const [dailyFeeFrom, setDailyFeeFrom] = useState("")
  const [dailyFeeTo, setDailyFeeTo] = useState("")
  const [registrationFee, setRegistrationFee] = useState("")
  const [depositFee, setDepositFee] = useState("")
  const [mealsFee, setMealsFee] = useState("")
  const [serviceTransport, setServiceTransport] = useState(false)
  const [serviceExtendedHours, setServiceExtendedHours] = useState(false)
  const [servicePickupDropoff, setServicePickupDropoff] = useState(false)
  const [serviceExtracurriculars, setServiceExtracurriculars] = useState(false)
  const [currencyId, setCurrencyId] = useState("")
  const [totalCapacity, setTotalCapacity] = useState("")
  const [virtualTourUrls, setVirtualTourUrls] = useState<string[]>([""])
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string }>>([])
  const [photoItems, setPhotoItems] = useState<Array<{ key: string; file: File; caption: string }>>([])
  const [providerTypes, setProviderTypes] = useState<string[]>([])
  const [selectedProgramTypeIds, setSelectedProgramTypeIds] = useState<string[]>([])
  const [ageGroupsServed, setAgeGroupsServed] = useState<string[]>([])
  const [selectedCurriculumTypes, setSelectedCurriculumTypes] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState(0)

  const setCountryId = (value: string) => {
    setCountryIdState(value)
    if (value && cityId) {
      const cityRow = cities.find((c) => c.id === cityId)
      if (cityRow && cityRow.country_id !== value) setCityId("")
    }
  }

  const visibleCities = useMemo(() => {
    if (!countryId) return cities
    return cities.filter((c) => c.country_id === countryId)
  }, [cities, countryId])

  const cityDisplayName = useMemo(
    () => cities.find((c) => c.id === cityId)?.name ?? "",
    [cities, cityId]
  )

  const addVirtualTour = () => setVirtualTourUrls((prev) => [...prev, ""])
  const updateVirtualTour = (i: number, v: string) =>
    setVirtualTourUrls((prev) => prev.map((item, idx) => (idx === i ? v : item)))
  const removeVirtualTour = (i: number) =>
    setVirtualTourUrls((prev) => {
      const next = prev.filter((_, idx) => idx !== i)
      return next.length === 0 ? [""] : next
    })

  const addFaq = () =>
    setFaqs((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, question: "", answer: "" },
    ])
  const updateFaq = (id: string, key: "question" | "answer", value: string) =>
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)))
  const removeFaq = (id: string) => setFaqs((prev) => prev.filter((f) => f.id !== id))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setPhotoItems((prev) => {
      const keys = new Set(prev.map((p) => p.key))
      const next = [...prev]
      for (const file of files) {
        const key = toFileKey(file)
        if (keys.has(key)) continue
        keys.add(key)
        next.push({ key, file, caption: "" })
      }
      return next
    })
    e.target.value = ""
  }
  const updatePhotoCaption = (i: number, v: string) =>
    setPhotoItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, caption: v } : item)))
  const removePhotoItem = (i: number) => {
    setPhotoItems((prev) => prev.filter((_, idx) => idx !== i))
    setPrimaryPhotoIndex((prev) => {
      if (i < prev) return prev - 1
      if (i === prev) return 0
      return prev
    })
  }

  const canProceedStep1 = businessName.trim().length > 0 && description.trim().length > 0
  const canProceedStep2 = address.trim().length > 0 && cityId.trim().length > 0
  const canProceedStep3 = true
  const canProceedStep4 = true
  const canProceedStep5 = canProceedStep1 && canProceedStep2

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return canProceedStep1
      case 2:
        return canProceedStep2
      case 3:
        return canProceedStep3
      case 4:
        return canProceedStep4
      case 5:
        return canProceedStep5
      default:
        return false
    }
  }, [currentStep, canProceedStep1, canProceedStep2, canProceedStep3, canProceedStep4, canProceedStep5])

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) setCurrentStep((currentStep + 1) as WizardStepId)
  }
  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as WizardStepId)
  }
  const handleCancel = () => router.push("/admin/listings")

  const handleSubmit = () => {
    setError(null)
    const formData = new FormData()
    formData.set("businessName", businessName.trim())
    formData.set("description", description.trim())
    formData.set("phone", phone.trim())
    formData.set("website", website.trim())
    formData.set("address", address.trim())
    formData.set("city", "")
    formData.set("countryId", countryId)
    formData.set("cityId", cityId)
    formData.set("listingStatus", listingStatus)
    formData.set("featured", featured ? "true" : "false")
    for (const c of selectedCurriculumTypes) formData.append("curriculumTypes", c)
    formData.set("languagesSpoken", selectedLanguages.join(", "))
    formData.set("openingTime", openingTime.trim())
    formData.set("closingTime", closingTime.trim())
    formData.set("dailyFeeFrom", dailyFeeFrom.trim())
    formData.set("dailyFeeTo", dailyFeeTo.trim())
    formData.set("registrationFee", registrationFee.trim())
    formData.set("depositFee", depositFee.trim())
    formData.set("mealsFee", mealsFee.trim())
    formData.set("serviceTransport", serviceTransport ? "true" : "false")
    formData.set("serviceExtendedHours", serviceExtendedHours ? "true" : "false")
    formData.set("servicePickupDropoff", servicePickupDropoff ? "true" : "false")
    formData.set("serviceExtracurriculars", serviceExtracurriculars ? "true" : "false")
    formData.set("currencyId", currencyId)
    formData.set("totalCapacity", totalCapacity.trim())
    formData.set("faqsJson", JSON.stringify(faqs))
    formData.set("photoCaptionsJson", JSON.stringify(photoItems.map((p) => p.caption)))
    formData.set("primaryPhotoIndex", String(primaryPhotoIndex))
    for (const type of providerTypes) formData.append("providerTypes", type)
    for (const programTypeId of selectedProgramTypeIds) formData.append("programTypeIds", programTypeId)
    for (const group of ageGroupsServed) formData.append("ageGroupsServed", group)
    for (const amenity of amenities) formData.append("amenities", amenity)
    for (const url of virtualTourUrls) {
      if (url.trim()) formData.append("virtualTourUrls", url.trim())
    }
    for (const item of photoItems) formData.append("photos", item.file)

    startTransition(async () => {
      const result = await createAdminProvider(formData)
      if (!result.ok) {
        setError(result.error)
        toast({ title: "Could not create provider", description: result.error, variant: "destructive" })
        return
      }
      toast({
        title: "Provider created",
        description: "The provider listing has been added successfully.",
        variant: "success",
      })
      router.push(`/admin/listings/${result.profileId}`)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <WizardProgress currentStep={currentStep} />

      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <Step1Basics
            businessName={businessName}
            setBusinessName={setBusinessName}
            phone={phone}
            setPhone={setPhone}
            website={website}
            setWebsite={setWebsite}
            description={description}
            setDescription={setDescription}
          />
        )}
        {currentStep === 2 && (
          <Step2LocationVisibility
            address={address}
            setAddress={setAddress}
            countryId={countryId}
            setCountryId={setCountryId}
            cityId={cityId}
            setCityId={setCityId}
            listingStatus={listingStatus}
            setListingStatus={setListingStatus}
            featured={featured}
            setFeatured={setFeatured}
            countries={countries}
            visibleCities={visibleCities}
          />
        )}
        {currentStep === 3 && (
          <Step3ProgramDetails
            providerTypes={providerTypes}
            setProviderTypes={setProviderTypes}
            selectedProgramTypeIds={selectedProgramTypeIds}
            setSelectedProgramTypeIds={setSelectedProgramTypeIds}
            ageGroupsServed={ageGroupsServed}
            setAgeGroupsServed={setAgeGroupsServed}
            selectedCurriculumTypes={selectedCurriculumTypes}
            setSelectedCurriculumTypes={setSelectedCurriculumTypes}
            selectedLanguages={selectedLanguages}
            setSelectedLanguages={setSelectedLanguages}
            amenities={amenities}
            setAmenities={setAmenities}
            curriculum={curriculum}
            languages={languages}
            ageGroups={ageGroups}
            programTypes={programTypes}
            providerTypeOptions={providerTypeOptions}
          />
        )}
        {currentStep === 4 && (
          <Step4OperationsMedia
            openingTime={openingTime}
            setOpeningTime={setOpeningTime}
            closingTime={closingTime}
            setClosingTime={setClosingTime}
            dailyFeeFrom={dailyFeeFrom}
            setDailyFeeFrom={setDailyFeeFrom}
            dailyFeeTo={dailyFeeTo}
            setDailyFeeTo={setDailyFeeTo}
            registrationFee={registrationFee}
            setRegistrationFee={setRegistrationFee}
            depositFee={depositFee}
            setDepositFee={setDepositFee}
            mealsFee={mealsFee}
            setMealsFee={setMealsFee}
            serviceTransport={serviceTransport}
            setServiceTransport={setServiceTransport}
            serviceExtendedHours={serviceExtendedHours}
            setServiceExtendedHours={setServiceExtendedHours}
            servicePickupDropoff={servicePickupDropoff}
            setServicePickupDropoff={setServicePickupDropoff}
            serviceExtracurriculars={serviceExtracurriculars}
            setServiceExtracurriculars={setServiceExtracurriculars}
            currencyId={currencyId}
            setCurrencyId={setCurrencyId}
            currencies={currencies}
            totalCapacity={totalCapacity}
            setTotalCapacity={setTotalCapacity}
            virtualTourUrls={virtualTourUrls}
            addVirtualTour={addVirtualTour}
            updateVirtualTour={updateVirtualTour}
            removeVirtualTour={removeVirtualTour}
            faqs={faqs}
            addFaq={addFaq}
            updateFaq={updateFaq}
            removeFaq={removeFaq}
            photoItems={photoItems}
            handleFileChange={handleFileChange}
            updatePhotoCaption={updatePhotoCaption}
            removePhotoItem={removePhotoItem}
            primaryPhotoIndex={primaryPhotoIndex}
            setPrimaryPhotoIndex={setPrimaryPhotoIndex}
          />
        )}
        {currentStep === 5 && (
          <Step5ReviewSubmit
            businessName={businessName}
            phone={phone}
            website={website}
            description={description}
            address={address}
            city={cityDisplayName}
            listingStatus={listingStatus}
            featured={featured}
            providerTypes={providerTypes}
            selectedProgramTypeIds={selectedProgramTypeIds}
            ageGroupsServed={ageGroupsServed}
            selectedCurriculumTypes={selectedCurriculumTypes}
            selectedLanguages={selectedLanguages}
            amenities={amenities}
            openingTime={openingTime}
            closingTime={closingTime}
            dailyFeeFrom={dailyFeeFrom}
            dailyFeeTo={dailyFeeTo}
            registrationFee={registrationFee}
            depositFee={depositFee}
            mealsFee={mealsFee}
            serviceTransport={serviceTransport}
            serviceExtendedHours={serviceExtendedHours}
            servicePickupDropoff={servicePickupDropoff}
            serviceExtracurriculars={serviceExtracurriculars}
            currencyId={currencyId}
            currencies={currencies}
            totalCapacity={totalCapacity}
            virtualTourUrls={virtualTourUrls}
            faqs={faqs}
            photoItems={photoItems}
            curriculumOptions={curriculum}
            ageGroups={ageGroups}
            programTypes={programTypes}
            providerTypeOptions={providerTypeOptions}
          />
        )}
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <WizardFooter
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        canProceed={canProceed}
        isPending={isPending}
        onCancel={handleCancel}
      />
    </div>
  )
}
