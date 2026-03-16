"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

export type AgeGroupOption = {
  id: string
  name: string
  age_range: string | null
}

export type ProgramTypeFormData = {
  name: string
  sortOrder: number
  isActive: boolean
  shortDescription: string
  aboutText: string
  ageGroupIds: string[]
  keyBenefits: string[]
  faqs: { question: string; answer: string }[]
}

const EMPTY_FORM: ProgramTypeFormData = {
  name: "",
  sortOrder: 0,
  isActive: true,
  shortDescription: "",
  aboutText: "",
  ageGroupIds: [],
  keyBenefits: [],
  faqs: [],
}

type ProgramTypeEditorProps = {
  ageGroups: AgeGroupOption[]
  initialData?: Partial<ProgramTypeFormData> | null
  onSubmit: (data: ProgramTypeFormData) => Promise<void>
  onCancel: () => void
  isPending: boolean
  isEdit?: boolean
}

export function ProgramTypeEditor({
  ageGroups,
  initialData,
  onSubmit,
  onCancel,
  isPending,
  isEdit = false,
}: ProgramTypeEditorProps) {
  const form: ProgramTypeFormData = {
    name: initialData?.name ?? EMPTY_FORM.name,
    sortOrder: initialData?.sortOrder ?? EMPTY_FORM.sortOrder,
    isActive: initialData?.isActive ?? EMPTY_FORM.isActive,
    shortDescription: initialData?.shortDescription ?? EMPTY_FORM.shortDescription,
    aboutText: initialData?.aboutText ?? EMPTY_FORM.aboutText,
    ageGroupIds: initialData?.ageGroupIds?.length ? [...initialData.ageGroupIds] : [],
    keyBenefits: initialData?.keyBenefits?.length ? [...initialData.keyBenefits] : [],
    faqs:
      initialData?.faqs?.length ?
        initialData.faqs.map((f) => ({ question: f.question, answer: f.answer }))
      : [],
  }

  const [name, setName] = useState(form.name)
  const [sortOrder, setSortOrder] = useState(String(form.sortOrder))
  const [isActive, setIsActive] = useState(form.isActive)
  const [shortDescription, setShortDescription] = useState(form.shortDescription)
  const [aboutText, setAboutText] = useState(form.aboutText)
  const [ageGroupIds, setAgeGroupIds] = useState<string[]>(form.ageGroupIds)
  const [keyBenefits, setKeyBenefits] = useState<string[]>(form.keyBenefits)
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(form.faqs)
  const [error, setError] = useState<string | null>(null)

  const toggleAgeGroup = (id: string) => {
    setAgeGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleAddBenefit = () => {
    setKeyBenefits((prev) => [...prev, ""])
  }

  const handleRemoveBenefit = (index: number) => {
    setKeyBenefits((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBenefitChange = (index: number, value: string) => {
    setKeyBenefits((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddFaq = () => {
    setFaqs((prev) => [...prev, { question: "", answer: "" }])
  }

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFaqChange = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    setFaqs((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Program type name is required.")
      return
    }

    const data: ProgramTypeFormData = {
      name: trimmedName,
      sortOrder: Number(sortOrder) || 0,
      isActive,
      shortDescription: shortDescription.trim() || "",
      aboutText: aboutText.trim() || "",
      ageGroupIds,
      keyBenefits: keyBenefits.map((b) => b.trim()).filter(Boolean),
      faqs: faqs
        .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
        .filter((f) => f.question || f.answer),
    }

    try {
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save program type.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="program-type-name">Name</Label>
        <Input
          id="program-type-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Infant Care"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Label htmlFor="program-type-sort">Sort order</Label>
          <Input
            id="program-type-sort"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="program-type-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="program-type-active">Active</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="program-type-short">Short description</Label>
        <Input
          id="program-type-short"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Brief 1-2 sentence summary (e.g. Nurturing care for babies 6 weeks to 12 months)"
        />
      </div>

      <div className="space-y-2">
        <Label>Age groups</Label>
        <p className="text-sm text-muted-foreground">
          Select which age groups this program type serves (from the directory).
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          {ageGroups.map((ag) => (
            <div key={ag.id} className="flex items-center space-x-2">
              <Checkbox
                id={`age-${ag.id}`}
                checked={ageGroupIds.includes(ag.id)}
                onCheckedChange={() => toggleAgeGroup(ag.id)}
              />
              <Label
                htmlFor={`age-${ag.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {ag.name}
                {ag.age_range ? ` (${ag.age_range})` : ""}
              </Label>
            </div>
          ))}
        </div>
        {ageGroups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No age groups configured. Add age groups in the Directory first.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="program-type-about">About the program</Label>
        <Textarea
          id="program-type-about"
          value={aboutText}
          onChange={(e) => setAboutText(e.target.value)}
          placeholder="Describe this program type for parents..."
          rows={4}
          className="resize-y"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Key Benefits</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddBenefit}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add benefit
          </Button>
        </div>
        <div className="space-y-2">
          {keyBenefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={benefit}
                onChange={(e) => handleBenefitChange(index, e.target.value)}
                placeholder="Enter a key benefit"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleRemoveBenefit(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {keyBenefits.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No benefits added. Click &quot;Add benefit&quot; to add one.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Frequently Asked Questions</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddFaq}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add FAQ
          </Button>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-lg border border-border p-3 space-y-2"
            >
              <div className="flex gap-2">
                <Input
                  value={faq.question}
                  onChange={(e) =>
                    handleFaqChange(index, "question", e.target.value)
                  }
                  placeholder="Question"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveFaq(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={faq.answer}
                onChange={(e) =>
                  handleFaqChange(index, "answer", e.target.value)
                }
                placeholder="Answer"
                rows={2}
                className="resize-y"
              />
            </div>
          ))}
          {faqs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No FAQs added. Click &quot;Add FAQ&quot; to add one.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isEdit ? "Save Program Type" : "Create Program Type"}
        </Button>
      </div>
    </form>
  )
}
