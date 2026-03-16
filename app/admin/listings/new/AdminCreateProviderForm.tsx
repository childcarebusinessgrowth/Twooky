"use client"

import { useMemo, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { PROVIDER_TYPES } from "@/lib/provider-types"
import { AGE_GROUPS, AMENITIES } from "@/lib/listing-options"
import type {
  AdminProviderCityOption,
  AdminProviderCountryOption,
  AdminProviderCurriculumOption,
  AdminProviderLanguageOption,
} from "./actions"
import { createAdminProvider } from "./actions"

type FaqItem = { id: string; question: string; answer: string }
type PhotoItem = { key: string; file: File; caption: string }

function toFileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

export function AdminCreateProviderForm({
  countries,
  cities,
  languages,
  curriculum,
}: {
  countries: AdminProviderCountryOption[]
  cities: AdminProviderCityOption[]
  languages: AdminProviderLanguageOption[]
  curriculum: AdminProviderCurriculumOption[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [countryId, setCountryId] = useState<string>("")
  const [cityId, setCityId] = useState<string>("")
  const [listingStatus, setListingStatus] = useState<string>("active")
  const [featured, setFeatured] = useState(false)
  const [virtualTourUrls, setVirtualTourUrls] = useState<string[]>([""])
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([])
  const [providerTypes, setProviderTypes] = useState<string[]>([])
  const [ageGroupsServed, setAgeGroupsServed] = useState<string[]>([])
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>([])
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const visibleCities = useMemo(() => {
    if (!countryId) return cities
    return cities.filter((city) => city.country_id === countryId)
  }, [cities, countryId])

  const addVirtualTour = () => setVirtualTourUrls((prev) => [...prev, ""])
  const updateVirtualTour = (index: number, value: string) => {
    setVirtualTourUrls((prev) => prev.map((item, i) => (i === index ? value : item)))
  }
  const removeVirtualTour = (index: number) => {
    setVirtualTourUrls((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length === 0 ? [""] : next
    })
  }

  const addFaq = () => {
    setFaqs((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, question: "", answer: "" },
    ])
  }
  const updateFaq = (id: string, key: "question" | "answer", value: string) => {
    setFaqs((prev) => prev.map((faq) => (faq.id === id ? { ...faq, [key]: value } : faq)))
  }
  const removeFaq = (id: string) => {
    setFaqs((prev) => prev.filter((faq) => faq.id !== id))
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    if (selectedFiles.length === 0) return

    setPhotoItems((prev) => {
      const existingKeys = new Set(prev.map((item) => item.key))
      const next = [...prev]

      for (const file of selectedFiles) {
        const key = toFileKey(file)
        if (existingKeys.has(key)) continue
        existingKeys.add(key)
        next.push({
          key,
          file,
          caption: "",
        })
      }

      return next
    })

    // Allow selecting the same file again in a later pick.
    event.target.value = ""
  }

  const updatePhotoCaption = (index: number, value: string) => {
    setPhotoItems((prev) => prev.map((item, i) => (i === index ? { ...item, caption: value } : item)))
  }

  const removePhotoItem = (index: number) => {
    setPhotoItems((prev) => prev.filter((_, i) => i !== index))
    setPrimaryPhotoIndex((prev) => {
      if (index < prev) return prev - 1
      if (index === prev) return 0
      return prev
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    formData.set("countryId", countryId)
    formData.set("cityId", cityId)
    formData.set("listingStatus", listingStatus)
    formData.set("featured", featured ? "true" : "false")
    formData.set("curriculumType", selectedCurriculum)
    formData.set("languagesSpoken", selectedLanguages.join(", "))
    formData.set("faqsJson", JSON.stringify(faqs))
    formData.set("photoCaptionsJson", JSON.stringify(photoItems.map((item) => item.caption)))
    formData.set("primaryPhotoIndex", String(primaryPhotoIndex))
    formData.delete("photos")
    for (const item of photoItems) formData.append("photos", item.file)
    formData.delete("providerTypes")
    for (const type of providerTypes) formData.append("providerTypes", type)
    formData.delete("ageGroupsServed")
    for (const group of ageGroupsServed) formData.append("ageGroupsServed", group)
    formData.delete("amenities")
    for (const amenity of amenities) formData.append("amenities", amenity)

    startTransition(async () => {
      const result = await createAdminProvider(formData)
      if (!result.ok) {
        setError(result.error)
        toast({ title: "Could not create provider", description: result.error, variant: "destructive" })
        return
      }
      toast({ title: "Provider created", description: "The provider listing has been added successfully.", variant: "success" })
      router.push(`/admin/listings/${result.profileId}`)
      router.refresh()
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Business Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input id="businessName" name="businessName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea id="description" name="description" rows={5} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input id="address" name="address" required />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Location and Visibility</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Country</Label>
            <Select
              value={countryId || "none"}
              onValueChange={(value) => {
                const nextCountry = value === "none" ? "" : value
                setCountryId(nextCountry)
                if (nextCountry && cityId) {
                  const city = cities.find((item) => item.id === cityId)
                  if (city && city.country_id !== nextCountry) {
                    setCityId("")
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No country selected</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Directory City</Label>
            <Select value={cityId || "none"} onValueChange={(value) => setCityId(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Optional city from directory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No directory city selected</SelectItem>
                {visibleCities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">Public City Label *</Label>
            <Input id="city" name="city" required placeholder="What parents should see" />
          </div>
          <div className="space-y-2">
            <Label>Listing Status</Label>
            <Select value={listingStatus} onValueChange={setListingStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <label className="inline-flex items-center gap-2">
          <Checkbox checked={featured} onCheckedChange={(checked) => setFeatured(Boolean(checked))} />
          <span className="text-sm">Feature this listing</span>
        </label>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Program Details</h2>
        <div className="space-y-2">
          <Label>Provider Types</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {PROVIDER_TYPES.map((type) => (
              <label key={type.id} className="inline-flex items-center gap-2">
                <Checkbox
                  checked={providerTypes.includes(type.id)}
                  onCheckedChange={(checked) =>
                    setProviderTypes((prev) =>
                      checked
                        ? prev.includes(type.id)
                          ? prev
                          : [...prev, type.id]
                        : prev.filter((item) => item !== type.id)
                    )
                  }
                />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Age Groups Served</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {AGE_GROUPS.map((group) => (
              <label key={group.id} className="inline-flex items-center gap-2">
                <Checkbox
                  checked={ageGroupsServed.includes(group.id)}
                  onCheckedChange={(checked) =>
                    setAgeGroupsServed((prev) =>
                      checked
                        ? prev.includes(group.id)
                          ? prev
                          : [...prev, group.id]
                        : prev.filter((item) => item !== group.id)
                    )
                  }
                />
                <span className="text-sm">{group.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Curriculum Type</Label>
            <Select value={selectedCurriculum || "none"} onValueChange={(value) => setSelectedCurriculum(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Optional curriculum type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No curriculum selected</SelectItem>
                {curriculum.map((item) => (
                  <SelectItem key={item.id} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Languages Spoken</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {languages.map((language) => (
                <label key={language.id} className="inline-flex items-center gap-2">
                  <Checkbox
                    checked={selectedLanguages.includes(language.name)}
                    onCheckedChange={(checked) =>
                      setSelectedLanguages((prev) =>
                        checked
                          ? prev.includes(language.name)
                            ? prev
                            : [...prev, language.name]
                          : prev.filter((item) => item !== language.name)
                      )
                    }
                  />
                  <span className="text-sm">{language.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Amenities and Features</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {AMENITIES.map((amenity) => (
              <label key={amenity.id} className="inline-flex items-center gap-2">
                <Checkbox
                  checked={amenities.includes(amenity.id)}
                  onCheckedChange={(checked) =>
                    setAmenities((prev) =>
                      checked
                        ? prev.includes(amenity.id)
                          ? prev
                          : [...prev, amenity.id]
                        : prev.filter((item) => item !== amenity.id)
                    )
                  }
                />
                <span className="text-sm">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Operating Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="openingTime">Opening Time</Label>
            <Input id="openingTime" name="openingTime" placeholder="07:00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="closingTime">Closing Time</Label>
            <Input id="closingTime" name="closingTime" placeholder="18:00" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="monthlyTuitionFrom">Monthly Tuition From</Label>
            <Input id="monthlyTuitionFrom" name="monthlyTuitionFrom" type="number" min="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyTuitionTo">Monthly Tuition To</Label>
            <Input id="monthlyTuitionTo" name="monthlyTuitionTo" type="number" min="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalCapacity">Total Capacity</Label>
            <Input id="totalCapacity" name="totalCapacity" type="number" min="0" />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Virtual Tours</h2>
          <Button type="button" variant="outline" size="sm" onClick={addVirtualTour}>
            <Plus className="mr-1 h-4 w-4" />
            Add URL
          </Button>
        </div>
        <div className="space-y-2">
          {virtualTourUrls.map((url, index) => (
            <div key={`tour-${index}`} className="flex gap-2">
              <Input
                name="virtualTourUrls"
                value={url}
                placeholder="https://www.youtube.com/watch?v=..."
                onChange={(event) => updateVirtualTour(index, event.target.value)}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => removeVirtualTour(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">FAQs</h2>
          <Button type="button" variant="outline" size="sm" onClick={addFaq}>
            <Plus className="mr-1 h-4 w-4" />
            Add FAQ
          </Button>
        </div>
        {faqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No FAQs yet.</p>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">FAQ</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFaq(faq.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
                <Input
                  value={faq.question}
                  placeholder="Question"
                  onChange={(event) => updateFaq(faq.id, "question", event.target.value)}
                />
                <Textarea
                  value={faq.answer}
                  rows={3}
                  placeholder="Answer"
                  onChange={(event) => updateFaq(faq.id, "answer", event.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Photos</h2>
        <div className="space-y-2">
          <Label htmlFor="photos">Upload Photos (PNG/JPG/WebP, max 10MB each)</Label>
          <Input id="photos" name="photos" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleFileChange} />
          <p className="text-xs text-muted-foreground">You can select multiple photos at once and add more in additional picks.</p>
        </div>

        {photoItems.length > 0 && (
          <div className="space-y-3">
            {photoItems.map((item, index) => (
              <div key={item.key} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(item.file.size / 1024)} KB</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="primary-photo"
                        checked={primaryPhotoIndex === index}
                        onChange={() => setPrimaryPhotoIndex(index)}
                      />
                      Primary
                    </label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePhotoItem(index)} aria-label={`Remove ${item.file.name}`}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Input
                  value={item.caption}
                  placeholder="Caption (optional)"
                  onChange={(event) => updatePhotoCaption(index, event.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Create Provider
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/listings")} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
