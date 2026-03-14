"use client"

import Link from "next/link"
import { Heart, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  loginHref: string
}

export function LoginToSaveFavoritesDialog({
  open,
  onOpenChange,
  loginHref,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="rounded-2xl border-border/60 p-0 overflow-hidden shadow-xl sm:max-w-md"
      >
        <div className="bg-linear-to-b from-primary/10 to-transparent px-6 pt-8 pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-4 ring-primary/5">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold tracking-tight text-foreground">
              Log in to save favorites
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-6 py-4">
          <DialogDescription className="text-center text-muted-foreground leading-relaxed">
            Sign in to your parent account to save this provider to your favorites and
            access them from your dashboard.
          </DialogDescription>
        </div>
        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-border/60 bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-border/60"
          >
            Cancel
          </Button>
          <Button asChild className="rounded-full font-medium shadow-sm">
            <Link href={loginHref} className="inline-flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Log in
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
