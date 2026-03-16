"use client"

import * as React from "react"
import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ConfirmDeleteVariant = "delete" | "remove"

export type ConfirmDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  itemName?: string
  variant?: ConfirmDeleteVariant
  onConfirm: () => void | Promise<void>
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  variant = "delete",
  onConfirm,
  confirmLabel,
  cancelLabel = "Cancel",
}: ConfirmDeleteDialogProps) {
  const [loading, setLoading] = React.useState(false)

  const defaultConfirmLabel = variant === "delete" ? "Delete" : "Remove"
  const label = confirmLabel ?? defaultConfirmLabel

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await Promise.resolve(onConfirm())
      onOpenChange(false)
    } catch {
      // Leave dialog open on error so user can retry or cancel
    } finally {
      setLoading(false)
    }
  }

  const isDelete = variant === "delete"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          "rounded-xl border border-border shadow-lg sm:max-w-md",
          isDelete && "border-destructive/20"
        )}
      >
        <AlertDialogHeader className="flex flex-col items-center text-center sm:items-center sm:text-center">
          <div
            className={cn(
              "mb-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              isDelete
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Trash2 className="h-5 w-5" />
          </div>
          <AlertDialogTitle className="text-lg font-semibold text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {itemName && (
                <p>
                  <span className="inline-block rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">
                    {itemName}
                  </span>
                </p>
              )}
              <div>{description}</div>
              {isDelete && (
                <p className="text-xs text-muted-foreground/90">
                  This action cannot be undone.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row gap-2 sm:justify-end">
          <AlertDialogCancel disabled={loading} className="mt-0">
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="min-w-24"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {label}…
              </>
            ) : (
              label
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
