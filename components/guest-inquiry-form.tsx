"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePickerField } from "@/components/date-picker-field"
import { useToast } from "@/hooks/use-toast"

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerSlug: string
  providerName?: string
  /** Lead source: directory (default) or compare */
  source?: "directory" | "compare"
  /** Optional program interest for the lead record */
  programInterest?: string
}

function parseDate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const d = new Date(trimmed)
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

export function GuestInquiryForm({
  open,
  onOpenChange,
  providerSlug,
  providerName,
  source = "directory",
  programInterest: programInterestProp,
}: Props) {
  const { toast } = useToast()
  const [childDob, setChildDob] = useState("")
  const [idealStartDate, setIdealStartDate] = useState("")
  const [programInterest, setProgramInterest] = useState("")
  const [message, setMessage] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [telephone, setTelephone] = useState("")
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const dob = parseDate(childDob)
    const startDate = parseDate(idealStartDate)
    if (!dob) {
      setError("Please enter a valid date of birth.")
      return
    }
    if (!startDate) {
      setError("Please enter a valid ideal start date.")
      return
    }
    if (!message.trim()) {
      setError("Please enter days/sessions required or your question.")
      return
    }
    if (!firstName.trim()) {
      setError("First name is required.")
      return
    }
    if (!lastName.trim()) {
      setError("Last name is required.")
      return
    }
    if (!email.trim()) {
      setError("Email is required.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.")
      return
    }
    if (!telephone.trim()) {
      setError("Telephone is required.")
      return
    }
    if (!consent) {
      setError("You must consent to data processing to submit.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/guest-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerSlug,
          childDob: dob,
          idealStartDate: startDate,
          message: message.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          telephone: telephone.trim(),
          consentToContact: true,
          source,
          programInterest: programInterest.trim() || programInterestProp?.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data.error as string) ?? "Something went wrong. Please try again.")
        return
      }
      toast({
        title: "Inquiry sent",
        description: "The provider will see your details and get in touch.",
      })
      onOpenChange(false)
      setChildDob("")
      setIdealStartDate("")
      setMessage("")
      setFirstName("")
      setLastName("")
      setEmail("")
      setTelephone("")
      setConsent(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="rounded-2xl border-border/60 p-0 overflow-hidden shadow-xl sm:max-w-2xl w-[95vw] flex flex-col max-h-[90vh]"
      >
        <DialogHeader className="shrink-0 px-8 pt-6 pb-3">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Send inquiry to {providerName ?? "provider"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Share your child&apos;s details and contact information. The provider will see this in their dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 space-y-5 min-h-0">
            {/* Section 1: Details about the child */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary bg-primary/5 rounded-t-md border border-border border-b-0 -mx-8 px-8 py-2.5">
                Details about the child requiring a place
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guest-child-dob" className="block text-sm font-medium text-foreground mb-1">
                    Date of Birth (use due date if relevant) *
                  </label>
                  <DatePickerField
                    id="guest-child-dob"
                    value={childDob}
                    onChange={setChildDob}
                    placeholder="mm/dd/yyyy"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="guest-ideal-start" className="block text-sm font-medium text-foreground mb-1">
                    Ideal Start Date *
                  </label>
                  <DatePickerField
                    id="guest-ideal-start"
                    value={idealStartDate}
                    onChange={setIdealStartDate}
                    placeholder="mm/dd/yyyy"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="guest-program-interest" className="block text-sm font-medium text-foreground mb-1">
                  Program Interest (optional)
                </label>
                <Input
                  id="guest-program-interest"
                  type="text"
                  className={inputClass}
                  placeholder="e.g. Preschool, Daycare, After-school"
                  value={programInterest}
                  onChange={(e) => setProgramInterest(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="guest-message" className="block text-sm font-medium text-foreground mb-1">
                  Days Required / Sessions Required (AM/PM/All Day) / Any Other Comments or Questions *
                </label>
                <textarea
                  id="guest-message"
                  required
                  className={`${inputClass} min-h-[88px] resize-y max-h-[180px]`}
                  placeholder="e.g. 3 days per week, AM sessions. Or: Hello! Please give me an estimate of the fees and what is included. Thank you!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Section 2: Your contact details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary bg-primary/5 rounded-t-md border border-border border-b-0 -mx-8 px-8 py-2.5">
                Your contact details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guest-first-name" className="block text-sm font-medium text-foreground mb-1">
                    First Name *
                  </label>
                  <Input
                    id="guest-first-name"
                    type="text"
                    required
                    className={inputClass}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="guest-last-name" className="block text-sm font-medium text-foreground mb-1">
                    Last Name *
                  </label>
                  <Input
                    id="guest-last-name"
                    type="text"
                    required
                    className={inputClass}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="guest-email" className="block text-sm font-medium text-foreground mb-1">
                    Email *
                  </label>
                  <Input
                    id="guest-email"
                    type="email"
                    required
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="guest-telephone" className="block text-sm font-medium text-foreground mb-1">
                    Telephone *
                  </label>
                  <Input
                    id="guest-telephone"
                    type="tel"
                    required
                    className={inputClass}
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/40 p-3">
              <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input accent-primary shrink-0"
                />
                <span>
                  I consent to Twooky processing my data and sharing it with this provider for contact and follow-up, in line with the{" "}
                  <a href="/privacy" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="shrink-0 flex gap-2 px-8 py-4 border-t border-border/60 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="rounded-full">
              {submitting ? "Sending…" : "Send inquiry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
