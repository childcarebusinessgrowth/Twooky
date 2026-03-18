"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ProviderOnboardingWelcomeProps = {
  isNewProvider: boolean
}

export function ProviderOnboardingWelcome({ isNewProvider }: ProviderOnboardingWelcomeProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isNewProvider) {
      setOpen(true)
    }
  }, [isNewProvider])

  const handleStartTour = () => {
    setOpen(false)
    router.push("/dashboard/provider/listing?tour=1")
  }

  const handleLater = async () => {
    setOpen(false)
    try {
      await fetch("/api/provider/onboarding", { method: "PATCH" })
    } catch {
      // ignore
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          handleLater()
        }}
      >
        <DialogHeader>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Welcome to your provider dashboard</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Let&apos;s get your listing ready for families. We&apos;ll walk you through each section of your profile so you can add your business details, program info, and photos. Once complete, you&apos;ll submit for approval and we&apos;ll notify you when your listing is live.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleLater} className="w-full sm:w-auto">
            I&apos;ll do it later
          </Button>
          <Button onClick={handleStartTour} className="w-full sm:w-auto">
            Start profile tour
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
