"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Loader2, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import {
  getProviderAvailability,
  updateProviderAvailability,
  type ProviderAvailabilityStatus,
} from "./actions"

const AVAILABILITY_OPTIONS: Array<{
  value: ProviderAvailabilityStatus
  label: string
  description: string
}> = [
  {
    value: "openings",
    label: "Spots Available",
    description: "Visible as Spots Available to parents. Requires a spots count.",
  },
  {
    value: "waitlist",
    label: "Waitlist",
    description: "Visible as Waitlist to parents.",
  },
  {
    value: "full",
    label: "Full",
    description: "Visible as Full to parents.",
  },
]

export default function ProviderAvailabilityPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availabilityStatus, setAvailabilityStatus] = useState<ProviderAvailabilityStatus | null>(null)
  const [availableSpotsCount, setAvailableSpotsCount] = useState<string>("")

  useEffect(() => {
    let mounted = true

    getProviderAvailability().then(({ data, error: loadError }) => {
      if (!mounted) return
      setLoading(false)
      if (loadError) {
        setError(loadError)
        return
      }
      if (!data) return
      setAvailabilityStatus(data.availabilityStatus)
      setAvailableSpotsCount(data.availableSpotsCount != null ? String(data.availableSpotsCount) : "")
    })

    return () => {
      mounted = false
    }
  }, [])

  const parsedSpots = Number.parseInt(availableSpotsCount, 10)
  const spotsValue = Number.isNaN(parsedSpots) ? null : parsedSpots
  const openingsNeedsCount =
    availabilityStatus === "openings" && (spotsValue == null || spotsValue <= 0)

  const onSave = async () => {
    if (availabilityStatus == null) {
      setError("Availability is still loading. Please wait a moment and try again.")
      return
    }

    if (openingsNeedsCount) {
      setError("Please enter how many spots are currently available.")
      return
    }

    setSaving(true)
    setError(null)

    const { error: saveError } = await updateProviderAvailability({
      availabilityStatus,
      availableSpotsCount: availabilityStatus === "openings" ? spotsValue : null,
    })

    setSaving(false)

    if (saveError) {
      setError(saveError)
      toast({ title: "Could not save availability", variant: "destructive" })
      return
    }

    if (availabilityStatus !== "openings") {
      setAvailableSpotsCount("")
    }

    toast({ title: "Availability updated", variant: "success" })
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Availability</h1>
          <p className="text-muted-foreground">
            Update the enrollment status shown to parents on your public profile.
          </p>
        </div>
        <Button onClick={onSave} disabled={saving || loading}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Availability Status</CardTitle>
              <CardDescription>
                Choose what parents should see right now.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading saved availability...
            </div>
          ) : (
            <FieldGroup>
              <Field>
                <FieldLabel>Current Status</FieldLabel>
                <div className="mt-3 grid gap-3">
                  {AVAILABILITY_OPTIONS.map((option) => {
                    const selected = availabilityStatus === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAvailabilityStatus(option.value)}
                        className={`w-full rounded-lg border p-4 text-left transition-colors ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                        aria-pressed={selected}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">{option.label}</p>
                          {selected ? <Badge variant="default">Selected</Badge> : <Badge variant="outline">Select</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                      </button>
                    )
                  })}
                </div>
              </Field>

              <Field>
                <FieldLabel>Available Spots (required for Spots Available)</FieldLabel>
                <FieldDescription>
                  Enter a number only when status is set to Spots Available.
                </FieldDescription>
                <div className="mt-3 max-w-xs">
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={availableSpotsCount}
                    onChange={(event) => setAvailableSpotsCount(event.target.value)}
                    disabled={availabilityStatus !== "openings"}
                    placeholder="e.g. 12"
                  />
                </div>
                {openingsNeedsCount && (
                  <p className="mt-2 text-xs text-destructive">
                    Add a valid spots count greater than 0 to save Spots Available.
                  </p>
                )}
              </Field>
            </FieldGroup>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
