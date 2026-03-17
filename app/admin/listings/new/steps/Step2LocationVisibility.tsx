"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WizardStepHeader } from "../_components/WizardStepHeader"
import type { AdminProviderCityOption, AdminProviderCountryOption } from "../actions"

type Step2LocationVisibilityProps = {
  address: string
  setAddress: (v: string) => void
  city: string
  setCity: (v: string) => void
  countryId: string
  setCountryId: (v: string) => void
  cityId: string
  setCityId: (v: string) => void
  listingStatus: string
  setListingStatus: (v: string) => void
  featured: boolean
  setFeatured: (v: boolean) => void
  countries: AdminProviderCountryOption[]
  cities: AdminProviderCityOption[]
  visibleCities: AdminProviderCityOption[]
}

export function Step2LocationVisibility({
  address,
  setAddress,
  city,
  setCity,
  countryId,
  setCountryId,
  cityId,
  setCityId,
  listingStatus,
  setListingStatus,
  featured,
  setFeatured,
  countries,
  visibleCities,
}: Step2LocationVisibilityProps) {
  const missingRequired =
    (!address.trim() || !city.trim()) && (address.length > 0 || city.length > 0)

  return (
    <div className="space-y-6">
      <WizardStepHeader
        title="Location and Visibility"
        description="Where the provider is located and how it appears in the directory."
      />
      {missingRequired && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Please fill in Address and Public City Label to continue.
        </p>
      )}

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 High Street, London"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Directory mapping</CardTitle>
          <p className="text-sm text-muted-foreground">Optional: link to a country/city in the directory for filtering.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={countryId || "none"}
                onValueChange={(value) => setCountryId(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No country selected</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
                  {visibleCities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Public-facing info</CardTitle>
          <p className="text-sm text-muted-foreground">What parents see on the listing.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">
                Public City Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="What parents should see (e.g. London)"
                required
              />
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
          <label className="flex items-center gap-2">
            <Checkbox checked={featured} onCheckedChange={(checked) => setFeatured(Boolean(checked))} />
            <span className="text-sm font-medium">Feature this listing</span>
          </label>
        </CardContent>
      </Card>
    </div>
  )
}
