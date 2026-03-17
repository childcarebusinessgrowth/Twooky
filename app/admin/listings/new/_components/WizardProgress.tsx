"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { WIZARD_STEPS, type WizardStepId } from "../types"

export function WizardProgress({ currentStep }: { currentStep: WizardStepId }) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const isComplete = currentStep > step.id
          const isCurrent = currentStep === step.id
          const isLast = index === WIZARD_STEPS.length - 1

          return (
            <li
              key={step.id}
              className={cn(
                "flex flex-1 items-center",
                !isLast && "after:ml-2 after:flex-1 after:border-t after:border-border after:content-[''] sm:after:ml-4",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isCurrent && "bg-primary/10 text-primary ring-1 ring-primary/30",
                  isComplete && "text-muted-foreground",
                  !isCurrent && !isComplete && "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    !isComplete && !isCurrent && "border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
