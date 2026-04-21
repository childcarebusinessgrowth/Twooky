'use client'

import { RequireAuth } from "@/components/RequireAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/components/AuthProvider"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { normalizeAgeRangeLabel, normalizeAgeRangeValues } from "@/lib/age-range-label"

type AgeGroupOption = { value: string; label: string }

type ProfileData = {
  displayName: string
  email: string
}

type ParentProfileData = {
  childAgeGroups: string[]
  phone: string
  preferredStartDate: string
}

const emptyProfile: ProfileData = { displayName: "", email: "" }
const emptyParentProfile: ParentProfileData = {
  childAgeGroups: [],
  phone: "",
  preferredStartDate: "",
}

export default function ParentSettingsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData>(emptyProfile)
  const [parentProfile, setParentProfile] = useState<ParentProfileData>(emptyParentProfile)
  const [ageGroupOptions, setAgeGroupOptions] = useState<AgeGroupOption[]>([])

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    const supabase = getSupabaseClient()
    const [profileRes, parentRes, ageGroupsRes] = await Promise.all([
      supabase.from("profiles").select("display_name, email").eq("id", user.id).maybeSingle(),
      supabase.from("parent_profiles").select("child_age_groups, phone, preferred_start_date").eq("profile_id", user.id).maybeSingle(),
      supabase.from("age_groups").select("tag, age_range").eq("is_active", true).order("sort_order", { ascending: true }),
    ])
    if (ageGroupsRes.data) {
      const rows = ageGroupsRes.data as { tag: string; age_range: string }[]
      setAgeGroupOptions(
        rows.map((r) => ({
          value: r.tag,
          label: normalizeAgeRangeLabel(r.age_range),
        })),
      )
    }
    if (profileRes.data) {
      setProfile({
        displayName: profileRes.data.display_name ?? "",
        email: profileRes.data.email ?? "",
      })
    }
    if (parentRes.data) {
      const row = parentRes.data as { child_age_groups?: string[] | null; phone?: string | null; preferred_start_date?: string | null }
      const dateVal = row.preferred_start_date
      setParentProfile({
        childAgeGroups: normalizeAgeRangeValues(row.child_age_groups ?? []),
        phone: row.phone ?? "",
        preferredStartDate: dateVal ? (typeof dateVal === "string" ? dateVal.slice(0, 10) : "") : "",
      })
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const childAgeOptions = useMemo(() => {
    const selected = normalizeAgeRangeValues(parentProfile.childAgeGroups)
    const optionMap = new Map<string, AgeGroupOption>()

    ageGroupOptions.forEach((option) => {
      optionMap.set(option.value.toLowerCase(), option)
    })

    selected.forEach((value) => {
      const key = value.toLowerCase()
      if (!optionMap.has(key)) {
        optionMap.set(key, { value, label: normalizeAgeRangeLabel(value) })
      }
    })

    return Array.from(optionMap.values())
  }, [ageGroupOptions, parentProfile.childAgeGroups])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user?.id) return
    setSaving(true)
    const supabase = getSupabaseClient()
    const normalizedChildAgeGroups = normalizeAgeRangeValues(parentProfile.childAgeGroups)
    const preferredDate =
      parentProfile.preferredStartDate?.trim() &&
      /^\d{4}-\d{2}-\d{2}$/.test(parentProfile.preferredStartDate.trim())
        ? parentProfile.preferredStartDate.trim()
        : null

    if (normalizedChildAgeGroups.length === 0) {
      toast({ title: "Please select at least one child age range.", variant: "destructive" })
      setSaving(false)
      return
    }

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: profile.displayName?.trim() || null })
        .eq("id", user.id)

      if (profileError) {
        toast({ title: "Could not update profile", description: profileError.message, variant: "destructive" })
        setSaving(false)
        return
      }

      const { error: parentError } = await supabase.from("parent_profiles").upsert(
        {
          profile_id: user.id,
          child_age_groups: normalizedChildAgeGroups,
          phone: parentProfile.phone?.trim() || null,
          preferred_start_date: preferredDate,
        },
        { onConflict: "profile_id" },
      )

      if (parentError) {
        toast({ title: "Could not update child information", description: parentError.message, variant: "destructive" })
        setSaving(false)
        return
      }

      await loadData()
      toast({
        title: "Settings saved",
        description: "Name, phone, child age ranges, and preferred start date have been saved.",
        variant: "success",
      })
    } catch (e) {
      toast({ title: "Something went wrong", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="space-y-6 lg:space-y-8">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr)]">
            <div className="h-48 animate-pulse rounded-3xl bg-muted" />
            <div className="h-48 animate-pulse rounded-3xl bg-muted" />
          </div>
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <form onSubmit={handleSave} className="space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            Account settings
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Update your contact details and child&apos;s information.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr)]">
          {/* Profile information */}
          <Card className="rounded-3xl border border-border/60 border-l-4 border-l-primary/60 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Profile information
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                This helps providers know who they&apos;re speaking with and how to reach you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full-name" className="text-xs font-medium text-foreground">
                    Full name
                  </Label>
                  <Input
                    id="full-name"
                    placeholder="Your name"
                    value={profile.displayName}
                    onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                    className="h-9 rounded-xl border-border/60 bg-muted/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(555) 123-4567"
                    value={parentProfile.phone}
                    onChange={(e) => setParentProfile((p) => ({ ...p, phone: e.target.value }))}
                    className="h-9 rounded-xl border-border/60 bg-muted/40"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  readOnly
                  className="h-9 rounded-xl border-border/60 bg-muted/40 read-only:opacity-80"
                />
                <p className="text-[11px] text-muted-foreground">Email cannot be changed here.</p>
              </div>
            </CardContent>
          </Card>

          {/* Child information */}
          <Card className="rounded-3xl border border-border/60 border-l-4 border-l-secondary/60 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Child information
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                The age you gave when you signed up is shown below. You can edit it here,we use it to personalize recommendations and availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="child-age" className="text-xs font-medium text-foreground">
                  Child age ranges
                </Label>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="mb-3 text-xs text-muted-foreground">
                    Select all age ranges that apply to your children.
                  </div>
                  <div className="grid gap-2">
                    {childAgeOptions.map((opt) => {
                      const checked = normalizeAgeRangeValues(parentProfile.childAgeGroups).some(
                        (value) => value.toLowerCase() === opt.value.toLowerCase(),
                      )

                      return (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-background px-3 py-2 transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              const isChecked = nextChecked === true
                              setParentProfile((current) => {
                                const normalized = normalizeAgeRangeValues(current.childAgeGroups)
                                return {
                                  ...current,
                                  childAgeGroups: isChecked
                                    ? Array.from(new Set([...normalized, opt.value]))
                                    : normalized.filter((value) => value.toLowerCase() !== opt.value.toLowerCase()),
                                }
                              })
                            }}
                            className="mt-0.5"
                          />
                          <span className="text-sm text-foreground">{opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preferred-start" className="text-xs font-medium text-foreground">
                  Preferred start date
                </Label>
                <Input
                  id="preferred-start"
                  type="date"
                  value={parentProfile.preferredStartDate}
                  onChange={(e) => setParentProfile((p) => ({ ...p, preferredStartDate: e.target.value }))}
                  className="h-9 rounded-xl border-border/60 bg-muted/40"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            className="rounded-full"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </RequireAuth>
  )
}
