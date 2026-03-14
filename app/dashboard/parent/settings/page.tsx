'use client'

import { RequireAuth } from "@/components/RequireAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"

export default function ParentSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const timeout = setTimeout(() => {
      setSaving(false)
      setSaveNotice("Settings persistence is coming soon. Your edits are only kept for this session.")
      clearTimeout(timeout)
    }, 800)
  }

  return (
    <RequireAuth>
      <form onSubmit={handleSave} className="space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            Account settings
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Update your contact details, child&apos;s information, and how you&apos;d like to
            hear from Early Learning Directory.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr)]">
          {/* Profile information */}
          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
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
                    placeholder="Sarah Anderson"
                    defaultValue="Sarah Anderson"
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
                    defaultValue="(555) 123-4567"
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
                  placeholder="you@example.com"
                  defaultValue="sarah.anderson@example.com"
                  className="h-9 rounded-xl border-border/60 bg-muted/40"
                />
              </div>
            </CardContent>
          </Card>

          {/* Child information */}
          <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Child information
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                We use this to personalize recommendations and availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="child-age" className="text-xs font-medium text-foreground">
                  Child age
                </Label>
                <Input
                  id="child-age"
                  placeholder="2 and 4 years"
                  defaultValue="2 and 4 years"
                  className="h-9 rounded-xl border-border/60 bg-muted/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preferred-start" className="text-xs font-medium text-foreground">
                  Preferred start date
                </Label>
                <Input
                  id="preferred-start"
                  type="date"
                  defaultValue="2026-08-15"
                  className="h-9 rounded-xl border-border/60 bg-muted/40"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Card className="rounded-3xl border border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Notifications
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Choose what you&apos;d like to be notified about. You can change this anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  Email alerts for new providers
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Get updates when new childcare options open up near your preferred locations.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  Inquiry responses
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Be notified when providers reply, confirm tour times, or ask follow-up questions.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground">
                  Review reminders
                </p>
                <p className="text-[11px] text-muted-foreground">
                  We&apos;ll gently remind you to leave a review after you&apos;ve visited or
                  enrolled with a provider.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            className="rounded-full"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save (preview only)"}
          </Button>
        </div>
        {saveNotice && (
          <p className="text-xs text-muted-foreground text-right">{saveNotice}</p>
        )}
      </form>
    </RequireAuth>
  )
}

