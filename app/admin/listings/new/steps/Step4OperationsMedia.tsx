"use client"

import { useRef, type ChangeEvent, useCallback } from "react"
import { Plus, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WizardStepHeader } from "../_components/WizardStepHeader"
import type { FaqItem, PhotoItem } from "../types"

type CurrencyOption = { id: string; code: string; name: string; symbol: string }

type Step4OperationsMediaProps = {
  openingTime: string
  setOpeningTime: (v: string) => void
  closingTime: string
  setClosingTime: (v: string) => void
  dailyFeeFrom: string
  setDailyFeeFrom: (v: string) => void
  dailyFeeTo: string
  setDailyFeeTo: (v: string) => void
  registrationFee: string
  setRegistrationFee: (v: string) => void
  depositFee: string
  setDepositFee: (v: string) => void
  mealsFee: string
  setMealsFee: (v: string) => void
  serviceTransport: boolean
  setServiceTransport: (v: boolean) => void
  serviceExtendedHours: boolean
  setServiceExtendedHours: (v: boolean) => void
  servicePickupDropoff: boolean
  setServicePickupDropoff: (v: boolean) => void
  serviceExtracurriculars: boolean
  setServiceExtracurriculars: (v: boolean) => void
  currencyId: string
  setCurrencyId: (v: string) => void
  currencies?: CurrencyOption[]
  totalCapacity: string
  setTotalCapacity: (v: string) => void
  virtualTourUrls: string[]
  addVirtualTour: () => void
  updateVirtualTour: (index: number, value: string) => void
  removeVirtualTour: (index: number) => void
  faqs: FaqItem[]
  addFaq: () => void
  updateFaq: (id: string, key: "question" | "answer", value: string) => void
  removeFaq: (id: string) => void
  photoItems: PhotoItem[]
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  updatePhotoCaption: (index: number, value: string) => void
  removePhotoItem: (index: number) => void
  primaryPhotoIndex: number
  setPrimaryPhotoIndex: (v: number) => void
}

export function Step4OperationsMedia({
  openingTime,
  setOpeningTime,
  closingTime,
  setClosingTime,
  dailyFeeFrom,
  setDailyFeeFrom,
  dailyFeeTo,
  setDailyFeeTo,
  registrationFee,
  setRegistrationFee,
  depositFee,
  setDepositFee,
  mealsFee,
  setMealsFee,
  serviceTransport,
  setServiceTransport,
  serviceExtendedHours,
  setServiceExtendedHours,
  servicePickupDropoff,
  setServicePickupDropoff,
  serviceExtracurriculars,
  setServiceExtracurriculars,
  currencyId,
  setCurrencyId,
  currencies,
  totalCapacity,
  setTotalCapacity,
  virtualTourUrls,
  addVirtualTour,
  updateVirtualTour,
  removeVirtualTour,
  faqs,
  addFaq,
  updateFaq,
  removeFaq,
  photoItems,
  handleFileChange,
  updatePhotoCaption,
  removePhotoItem,
  primaryPhotoIndex,
  setPrimaryPhotoIndex,
}: Step4OperationsMediaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files ?? []).filter((f) =>
        ["image/png", "image/jpeg", "image/webp"].includes(f.type),
      )
      if (files.length === 0) return
      const input = fileInputRef.current
      if (!input) return
      const dt = new DataTransfer()
      files.forEach((f) => dt.items.add(f))
      input.files = dt.files
      handleFileChange({ target: input } as unknown as ChangeEvent<HTMLInputElement>)
    },
    [handleFileChange],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), [])

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Operations and Media"
        description="Hours, tuition, virtual tours, FAQs, and photos."
      />

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Operating Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="openingTime">Opening Time</Label>
              <Input
                id="openingTime"
                name="openingTime"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                placeholder="07:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingTime">Closing Time</Label>
              <Input
                id="closingTime"
                name="closingTime"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                placeholder="18:00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Pricing and Capacity</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Select the currency for fee amounts. Daily fee and pricing components will be displayed with the
            selected symbol.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dailyFeeFrom">Daily Fee From</Label>
              <Input
                id="dailyFeeFrom"
                name="dailyFeeFrom"
                type="number"
                min={0}
                value={dailyFeeFrom}
                onChange={(e) => setDailyFeeFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyFeeTo">Daily Fee To</Label>
              <Input
                id="dailyFeeTo"
                name="dailyFeeTo"
                type="number"
                min={0}
                value={dailyFeeTo}
                onChange={(e) => setDailyFeeTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationFee">Registration Fee</Label>
              <Input
                id="registrationFee"
                name="registrationFee"
                type="number"
                min={0}
                value={registrationFee}
                onChange={(e) => setRegistrationFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositFee">Deposit</Label>
              <Input
                id="depositFee"
                name="depositFee"
                type="number"
                min={0}
                value={depositFee}
                onChange={(e) => setDepositFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealsFee">Meals Fee</Label>
              <Input
                id="mealsFee"
                name="mealsFee"
                type="number"
                min={0}
                value={mealsFee}
                onChange={(e) => setMealsFee(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currencyId || "none"} onValueChange={(v) => setCurrencyId(v === "none" ? "" : v)}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select currency</SelectItem>
                  {(currencies ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} ({c.symbol}) – {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalCapacity">Total Capacity</Label>
              <Input
                id="totalCapacity"
                name="totalCapacity"
                type="number"
                min={0}
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <Label>Additional Services</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={serviceTransport}
                  onCheckedChange={(checked) => setServiceTransport(Boolean(checked))}
                />
                Transport
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={serviceExtendedHours}
                  onCheckedChange={(checked) => setServiceExtendedHours(Boolean(checked))}
                />
                Extended Hours
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={servicePickupDropoff}
                  onCheckedChange={(checked) => setServicePickupDropoff(Boolean(checked))}
                />
                Pickup / Drop-off
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={serviceExtracurriculars}
                  onCheckedChange={(checked) => setServiceExtracurriculars(Boolean(checked))}
                />
                Extracurriculars
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Virtual Tours</CardTitle>
          <p className="text-sm text-muted-foreground">YouTube video URLs for virtual tours.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={addVirtualTour}>
              <Plus className="mr-1 h-4 w-4" />
              Add URL
            </Button>
          </div>
          <div className="space-y-2">
            {virtualTourUrls.map((url, index) => (
              <div key={`tour-${index}`} className="flex gap-2">
                <Input
                  value={url}
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={(e) => updateVirtualTour(index, e.target.value)}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => removeVirtualTour(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">FAQs</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addFaq}>
              <Plus className="mr-1 h-4 w-4" />
              Add FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No FAQs yet. Add one to help parents learn more.</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between gap-4 pr-2">
                      <span className="truncate text-left font-medium">
                        {faq.question || "Untitled FAQ"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFaq(faq.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Input
                          value={faq.question}
                          placeholder="Question"
                          onChange={(e) => updateFaq(faq.id, "question", e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Answer</Label>
                        <Textarea
                          value={faq.answer}
                          rows={3}
                          placeholder="Answer"
                          onChange={(e) => updateFaq(faq.id, "answer", e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Photos</CardTitle>
          <p className="text-sm text-muted-foreground">PNG, JPG, or WebP. Max 10MB each.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            id="photos"
            name="photos"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 py-10 transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Click to upload photos</span>
            <span className="text-xs text-muted-foreground">or drag and drop</span>
          </button>

          {photoItems.length > 0 && (
            <div className="space-y-3">
              <Label>Uploaded photos</Label>
              <RadioGroup
                value={String(primaryPhotoIndex)}
                onValueChange={(v) => setPrimaryPhotoIndex(Number.parseInt(v, 10))}
                className="grid gap-3 sm:grid-cols-2"
              >
                {photoItems.map((item, index) => (
                  <div
                    key={item.key}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.file.name.slice(0, 4)}…
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                          <RadioGroupItem value={String(index)} id={`primary-${index}`} />
                          Primary
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removePhotoItem(index)}
                          aria-label={`Remove ${item.file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{item.file.name}</p>
                      <Input
                        value={item.caption}
                        placeholder="Caption (optional)"
                        onChange={(e) => updatePhotoCaption(index, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
