"use client"

import { Check, ChevronDown, Sparkles, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatAgeRangeValues } from "@/lib/age-range-label"

export type AgeRangeOption = {
  value: string
  label: string
}

type AgeRangeChipPickerProps = {
  options: AgeRangeOption[]
  value: string[]
  onChange: (nextValue: string[]) => void
  helperText: string
  emptyText?: string
}

export function AgeRangeChipPicker({
  options,
  value,
  onChange,
  helperText,
  emptyText = "Loading age ranges...",
}: AgeRangeChipPickerProps) {
  const [open, setOpen] = useState(false)
  const [draftValue, setDraftValue] = useState<string[]>(value)
  const selectedCount = value.length

  useEffect(() => {
    if (!open) {
      setDraftValue(value)
    }
  }, [open, value])

  const triggerSummary = useMemo(() => {
    const summary = formatAgeRangeValues(value)
    return summary ?? "Select one or more age ranges"
  }, [value])

  const clearDraft = () => setDraftValue([])

  const toggleDraftValue = (nextValue: string, checked: boolean) => {
    setDraftValue((current) => {
      if (checked) {
        return Array.from(new Set([...current, nextValue]))
      }
      return current.filter((item) => item !== nextValue)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3.5 text-left text-sm shadow-sm transition",
            "hover:border-primary/35 hover:shadow-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
          )}
        >
          <div className="min-w-0 flex-1 truncate text-muted-foreground">
            {triggerSummary}
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 ? (
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">
                {selectedCount}
              </Badge>
            ) : null}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[min(44rem,calc(100vw-1.5rem))] gap-0 overflow-hidden p-0">
        <div className="border-b border-border/60 bg-linear-to-r from-primary/10 via-background to-secondary/10 px-5 py-4">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg">Choose child age ranges</DialogTitle>
            <DialogDescription className="text-sm">
              Pick every age range that applies. You can always change this later.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>{helperText}</span>
            </div>
            <div className="flex items-center gap-2">
              {draftValue.length > 0 ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
                  onClick={clearDraft}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all
                </button>
              ) : null}
            </div>
          </div>

          {draftValue.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {draftValue.map((selected) => {
                const matched = options.find((option) => option.value === selected)
                return (
                  <Badge
                    key={selected}
                    variant="outline"
                    className="rounded-full border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
                  >
                    {matched?.label ?? selected}
                  </Badge>
                )
              })}
            </div>
          ) : null}

          <div className="max-h-[52vh] overflow-y-auto pr-1">
            {options.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((option) => {
                  const checked = draftValue.includes(option.value)

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "group flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition",
                        checked
                          ? "border-primary/35 bg-primary/10 shadow-sm"
                          : "border-border/60 bg-background hover:border-primary/30 hover:bg-primary/5",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) => {
                          const isChecked = nextChecked === true
                          toggleDraftValue(option.value, isChecked)
                        }}
                        className="shrink-0"
                      />
                      <span className={cn("text-sm font-medium", checked ? "text-primary" : "text-foreground")}>
                        {option.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-background px-4 py-5 text-sm text-muted-foreground">
                {emptyText}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-background px-5 py-4">
          <div className="text-xs text-muted-foreground">
            {draftValue.length > 0 ? `${draftValue.length} range${draftValue.length === 1 ? "" : "s"} selected` : "No ranges selected"}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setDraftValue(value)
                setOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                onChange(draftValue)
                setOpen(false)
              }}
            >
              Save selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
