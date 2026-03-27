"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { DatePickerField } from "@/components/date-picker-field"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

/** Matches `Input` + `inputClass` microsite sizing so date triggers align with text fields */
const dateTriggerClass =
  "h-8 justify-between px-3 text-xs font-normal border-input bg-background shadow-xs hover:bg-background dark:bg-background dark:hover:bg-background"

type Props = {
  websiteSubdomain: string
  primaryColor?: string
  fontFamily?: string
  introHint?: string
  showProgramInterest?: boolean
}

function parseDate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const d = new Date(trimmed)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

export default function MicrositeContactForm({
  websiteSubdomain,
  primaryColor = "#2563eb",
  fontFamily,
  introHint,
  showProgramInterest = true,
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
          websiteSubdomain,
          childDob: dob,
          idealStartDate: startDate,
          message: message.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          telephone: telephone.trim(),
          consentToContact: true,
          source: "microsite",
          programInterest: showProgramInterest ? programInterest.trim() || undefined : undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      toast({
        title: "Message sent",
        description: "The provider will receive your details and can reply soon.",
      })
      setChildDob("")
      setIdealStartDate("")
      setProgramInterest("")
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
    <form
      onSubmit={handleSubmit}
      className="flex max-h-[min(720px,70vh)] flex-col gap-4 overflow-y-auto pr-1 text-left"
      style={fontFamily ? { fontFamily } : undefined}
    >
      {introHint?.trim() ? (
        <p className="text-muted-foreground text-xs leading-snug sm:text-sm">{introHint.trim()}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-foreground text-xs font-semibold sm:text-sm">About your child</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label htmlFor="ms-child-dob" className="mb-0.5 block text-[11px] font-medium sm:text-xs">
              Date of birth *
            </label>
            <DatePickerField
              id="ms-child-dob"
              value={childDob}
              onChange={setChildDob}
              placeholder="mm/dd/yyyy"
              disabled={submitting}
              className={dateTriggerClass}
            />
          </div>
          <div>
            <label htmlFor="ms-ideal-start" className="mb-0.5 block text-[11px] font-medium sm:text-xs">
              Ideal start date *
            </label>
            <DatePickerField
              id="ms-ideal-start"
              value={idealStartDate}
              onChange={setIdealStartDate}
              placeholder="mm/dd/yyyy"
              disabled={submitting}
              className={dateTriggerClass}
            />
          </div>
        </div>
        {showProgramInterest ? (
          <div>
            <label htmlFor="ms-program" className="mb-0.5 block text-[11px] font-medium sm:text-xs">
              Program interest (optional)
            </label>
            <Input
              id="ms-program"
              type="text"
              className={cn(inputClass, "h-8 text-xs")}
              placeholder="e.g. Preschool, full days"
              value={programInterest}
              onChange={(e) => setProgramInterest(e.target.value)}
              disabled={submitting}
            />
          </div>
        ) : null}
        <div>
          <label htmlFor="ms-message" className="mb-0.5 block text-[11px] font-medium sm:text-xs">
            Days / sessions / questions *
          </label>
          <textarea
            id="ms-message"
            required
            className={cn(inputClass, "min-h-[72px] max-h-[140px] resize-y text-xs")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-foreground text-xs font-semibold sm:text-sm">Your contact details</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label htmlFor="ms-fn" className="mb-0.5 block text-[11px] font-medium sm:text-xs">
              First name *
            </label>
            <Input
              id="ms-fn"
              className={cn(inputClass, "h-8 text-xs")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="ms-ln" className="mb-0.5 block text-[11px] font-medium sm:text-xs">
              Last name *
            </label>
            <Input
              id="ms-ln"
              className={cn(inputClass, "h-8 text-xs")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="ms-em" className="mb-0.5 block text-[11px] font-medium sm:text-xs">
              Email *
            </label>
            <Input
              id="ms-em"
              type="email"
              className={cn(inputClass, "h-8 text-xs")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="ms-tel" className="mb-0.5 block text-[11px] font-medium sm:text-xs">
              Telephone *
            </label>
            <Input
              id="ms-tel"
              type="tel"
              className={cn(inputClass, "h-8 text-xs")}
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <Checkbox
          id="ms-consent"
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          disabled={submitting}
          className="mt-0.5"
        />
        <label htmlFor="ms-consent" className="cursor-pointer text-[10px] leading-snug text-muted-foreground sm:text-xs">
          I consent to Early Learning Directory processing my data and sharing it with this provider for contact and
          follow-up, in line with the{" "}
          <a href="/privacy" className="text-primary underline" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          .
        </label>
      </div>

      {error ? <p className="text-destructive text-xs">{error}</p> : null}

      <Button
        type="submit"
        disabled={submitting}
        className="h-9 w-full shrink-0 text-sm font-medium"
        style={{ backgroundColor: primaryColor, color: "#fff" }}
      >
        {submitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  )
}
