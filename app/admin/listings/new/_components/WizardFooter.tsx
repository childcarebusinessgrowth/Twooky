"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WIZARD_STEPS, type WizardStepId } from "../types"

type WizardFooterProps = {
  currentStep: WizardStepId
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  canProceed: boolean
  isPending: boolean
  onCancel: () => void
}

export function WizardFooter({
  currentStep,
  onBack,
  onNext,
  onSubmit,
  canProceed,
  isPending,
  onCancel,
}: WizardFooterProps) {
  const isFirst = currentStep === 1
  const isLast = currentStep === WIZARD_STEPS.length

  return (
    <div className="sticky bottom-0 -mx-6 mt-8 border-t border-border bg-card/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {!isFirst && (
            <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
              Back
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        </div>
        <div className="flex gap-2">
          {isLast ? (
            <Button type="button" onClick={onSubmit} disabled={!canProceed || isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Provider
            </Button>
          ) : (
            <Button type="button" onClick={onNext} disabled={!canProceed || isPending}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
