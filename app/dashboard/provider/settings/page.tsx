"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Shield, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { useAuth } from "@/components/AuthProvider"
import {
  deactivateListing,
  deleteProviderAccount,
  getProviderNotificationPrefs,
  type ProviderNotificationPrefs,
  updateNotificationPrefs,
  updateProviderPassword,
} from "./actions"

export default function SettingsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [notificationPrefs, setNotificationPrefs] = useState<ProviderNotificationPrefs>({
    notify_new_inquiries: true,
    notify_new_reviews: true,
    notify_weekly_analytics: true,
  })
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [prefsSaving, setPrefsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const { data, error } = await getProviderNotificationPrefs()
      if (cancelled) return
      if (error) {
        toast({ title: "Unable to load notification preferences", variant: "destructive" })
      }
      if (data) {
        setNotificationPrefs(data)
      }
      setPrefsLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [toast])

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
    const { error } = await deleteProviderAccount()
    if (error) {
      toast({ title: error ?? "Failed to delete account", variant: "destructive" })
      throw new Error(error)
    }
    setDeleteDialogOpen(false)
    await signOut()
    router.replace("/")
    router.refresh()
  }

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({ title: "Fill all password fields", variant: "destructive" })
      return
    }

    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters long", variant: "destructive" })
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await updateProviderPassword({
        currentPassword,
        newPassword,
      })

      if (error) {
        toast({ title: error, variant: "destructive" })
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      toast({ title: "Password updated successfully", variant: "success" })
    } catch {
      toast({ title: "Unable to update password right now", variant: "destructive" })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleNotificationPrefsSave = async () => {
    setPrefsSaving(true)
    try {
      const { error } = await updateNotificationPrefs(notificationPrefs)
      if (error) {
        toast({ title: error, variant: "destructive" })
        return
      }
      toast({ title: "Notification preferences updated", variant: "success" })
    } catch {
      toast({ title: "Unable to update preferences right now", variant: "destructive" })
    } finally {
      setPrefsSaving(false)
    }
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
          <form onSubmit={handlePasswordSubmit}>
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
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={isUpdatingPassword}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>New Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={isUpdatingPassword}
                />
              </Field>

              <Field>
                <FieldLabel>Confirm New Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  disabled={isUpdatingPassword}
                />
              </Field>
            </div>

            <p className="text-sm text-muted-foreground">Use at least 8 characters for your new password.</p>
            <Button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Update Password
            </Button>
          </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Control which provider emails and dashboard alerts you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1 pr-2">
              <p className="font-medium text-foreground">New inquiry emails</p>
              <p className="text-sm text-muted-foreground">
                Get emailed when a new parent or guest inquiry arrives.
              </p>
            </div>
            <Switch
              checked={notificationPrefs.notify_new_inquiries}
              onCheckedChange={(checked) =>
                setNotificationPrefs((prev) => ({ ...prev, notify_new_inquiries: checked }))
              }
              disabled={prefsLoading || prefsSaving}
              aria-label="Toggle new inquiry emails"
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1 pr-2">
              <p className="font-medium text-foreground">New review emails</p>
              <p className="text-sm text-muted-foreground">
                Get emailed when a parent leaves a new review on your listing.
              </p>
            </div>
            <Switch
              checked={notificationPrefs.notify_new_reviews}
              onCheckedChange={(checked) =>
                setNotificationPrefs((prev) => ({ ...prev, notify_new_reviews: checked }))
              }
              disabled={prefsLoading || prefsSaving}
              aria-label="Toggle new review emails"
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-1 pr-2">
              <p className="font-medium text-foreground">Weekly analytics emails</p>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of traffic and engagement for your listing.
              </p>
            </div>
            <Switch
              checked={notificationPrefs.notify_weekly_analytics}
              onCheckedChange={(checked) =>
                setNotificationPrefs((prev) => ({ ...prev, notify_weekly_analytics: checked }))
              }
              disabled={prefsLoading || prefsSaving}
              aria-label="Toggle weekly analytics emails"
            />
          </div>

          <Button onClick={() => void handleNotificationPrefsSave()} disabled={prefsLoading || prefsSaving}>
            {prefsSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Preferences
          </Button>
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
