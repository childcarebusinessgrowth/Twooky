"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, Bell, Shield, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useAuth } from "@/components/AuthProvider"
import { getSupabaseClient } from "@/lib/supabaseClient"
import {
  getProviderNotificationPrefs,
  updateNotificationPrefs,
  deactivateListing,
  type ProviderNotificationPrefs,
} from "./actions"

export default function SettingsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [notificationPrefs, setNotificationPrefs] = useState<ProviderNotificationPrefs>({
    notify_new_inquiries: true,
    notify_new_reviews: true,
    notify_weekly_analytics: true,
  })
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    getProviderNotificationPrefs().then(({ data, error }) => {
      if (!mounted) return
      setPrefsLoading(false)
      if (error) {
        toast({ title: "Could not load notification preferences", variant: "destructive" })
        return
      }
      if (data) setNotificationPrefs(data)
    })
    return () => {
      mounted = false
    }
  }, [toast])

  const handleNotificationChange = async (
    key: keyof ProviderNotificationPrefs,
    value: boolean
  ) => {
    const next = { ...notificationPrefs, [key]: value }
    setNotificationPrefs(next)
    setPrefsSaving(true)
    const { error } = await updateNotificationPrefs(next)
    setPrefsSaving(false)
    if (error) {
      toast({ title: "Failed to save preference", variant: "destructive" })
      setNotificationPrefs(notificationPrefs)
      return
    }
    toast({ title: "Preferences saved", variant: "success" })
  }

  const handleDeactivateConfirm = async () => {
    const { error } = await deactivateListing()
    if (error) {
      toast({ title: "Failed to deactivate listing", variant: "destructive" })
      throw new Error(error)
    }
    setDeactivateDialogOpen(false)
    toast({ title: "Listing deactivated", variant: "success" })
  }

  const handleDeleteConfirm = async () => {
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.deleteUser()
    if (error) {
      toast({ title: error.message ?? "Failed to delete account", variant: "destructive" })
      throw new Error(error.message)
    }
    setDeleteDialogOpen(false)
    await signOut()
    router.replace("/")
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      {/* Account Information */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Update your login credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Email Address</FieldLabel>
              <Input
                type="email"
                value={user?.email ?? ""}
                disabled
                readOnly
                className="bg-muted"
              />
            </Field>

            <Separator />

            <Field>
              <FieldLabel>Current Password</FieldLabel>
              <Input
                type="password"
                placeholder="Enter current password"
                disabled
                className="bg-muted"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>New Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  disabled
                  className="bg-muted"
                />
              </Field>

              <Field>
                <FieldLabel>Confirm New Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  disabled
                  className="bg-muted"
                />
              </Field>
            </div>

            <p className="text-sm text-muted-foreground">Password change coming soon.</p>
            <Button disabled>
              <Save className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">New Inquiries</p>
              <p className="text-sm text-muted-foreground">Get notified when a parent sends an inquiry</p>
            </div>
            <Switch
              checked={notificationPrefs.notify_new_inquiries}
              onCheckedChange={(checked) => handleNotificationChange("notify_new_inquiries", checked)}
              disabled={prefsLoading || prefsSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">New Reviews</p>
              <p className="text-sm text-muted-foreground">Get notified when someone leaves a review</p>
            </div>
            <Switch
              checked={notificationPrefs.notify_new_reviews}
              onCheckedChange={(checked) => handleNotificationChange("notify_new_reviews", checked)}
              disabled={prefsLoading || prefsSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Weekly Analytics Report</p>
              <p className="text-sm text-muted-foreground">Receive a weekly summary of your listing performance</p>
            </div>
            <Switch
              checked={notificationPrefs.notify_weekly_analytics}
              onCheckedChange={(checked) => handleNotificationChange("notify_weekly_analytics", checked)}
              disabled={prefsLoading || prefsSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Deactivate Listing</p>
              <p className="text-sm text-muted-foreground">Temporarily hide your listing from search results</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setDeactivateDialogOpen(true)}
            >
              Deactivate
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        title="Deactivate listing?"
        description="Your listing will be hidden from search results. You can reactivate it later from the admin or when we add that option here."
        variant="remove"
        confirmLabel="Deactivate"
        onConfirm={handleDeactivateConfirm}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description={
          <>
            This will permanently delete your account, listing, photos, and remove all reviews associated with your profile.
          </>
        }
        variant="delete"
        confirmLabel="Delete Account"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
