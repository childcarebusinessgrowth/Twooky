"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WizardStepHeader } from "../_components/WizardStepHeader"

type Step1BasicsProps = {
  businessName: string
  setBusinessName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  website: string
  setWebsite: (v: string) => void
  description: string
  setDescription: (v: string) => void
}

export function Step1Basics({
  businessName,
  setBusinessName,
  phone,
  setPhone,
  website,
  setWebsite,
  description,
  setDescription,
}: Step1BasicsProps) {
  const missingRequired =
    (!businessName.trim() || !description.trim()) &&
    (businessName.length > 0 || description.length > 0)

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Business Information"
        description="Enter the core details parents will see when browsing your listing."
      />
      {missingRequired && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Please fill in Business Name and Description to continue.
        </p>
      )}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Basic details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="businessName"
                name="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Little Stars Nursery"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 20 1234 5678"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe your program, approach, and what makes your setting special..."
              required
            />
            <p className="text-xs text-muted-foreground">This appears on your public listing page.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
