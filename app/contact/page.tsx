"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

const inputClass =
  "w-full rounded-md border border-input bg-background/80 px-3 py-2.5 text-sm placeholder:text-muted-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition"

export default function ContactPage() {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [consentChecked, setConsentChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedMessage = message.trim()
    if (!trimmedName) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }
    if (!trimmedEmail) {
      toast({ title: "Email is required", variant: "destructive" })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" })
      return
    }
    if (!trimmedMessage) {
      toast({ title: "Message is required", variant: "destructive" })
      return
    }
    if (!consentChecked) {
      toast({ title: "You must consent to data processing to submit", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: phone.trim() || undefined,
          message: trimmedMessage,
          consentChecked: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: "Something went wrong",
          description: (data.error as string) || "Please try again.",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Message sent",
        description: "We'll get back to you within 1 business day.",
        variant: "success",
      })
      setName("")
      setEmail("")
      setPhone("")
      setMessage("")
      setConsentChecked(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-background">
      <section className="w-full max-w-6xl rounded-2xl border border-border bg-card text-foreground shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* Left side: info */}
          <div className="px-8 sm:px-10 md:px-12 py-10 md:py-12 space-y-8 bg-linear-to-br from-background via-background to-accent/20">
            <header className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
                Get in touch
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                If you have any questions regarding our services or need help, please fill out the form here.
                We do our best to respond within 1 business day.
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-2xl">
              <div className="flex items-start gap-3 rounded-xl bg-accent/30 border border-border px-4 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/60">
                  <span className="text-lg">✉</span>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Email</p>
                  <p className="text-sm font-medium wrap-break-word">contact@earlylearningdirectory.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-accent/30 border border-border px-4 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/60">
                  <span className="text-lg">☎</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">+44 20 7946 0123</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: form */}
          <div className="border-t md:border-t-0 md:border-l border-border bg-card px-6 sm:px-8 md:px-10 py-8 md:py-10">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium tracking-wide text-foreground">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className={inputClass}
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium tracking-wide text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-medium tracking-wide text-foreground">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={inputClass}
                  placeholder="+44 20 7946 0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-medium tracking-wide text-foreground">
                  Message
                </label>
                <textarea
                  id="message"
                  className={`${inputClass} min-h-[120px] resize-y`}
                  placeholder="How can we help?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-3">
                <label htmlFor="enquiry-consent" className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <input
                    id="enquiry-consent"
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                    required
                  />
                  <span>
                    I consent to Early Learning Directory processing my enquiry data and sharing it with relevant
                    providers for contact and follow-up, in line with the{" "}
                    <a href="/privacy" className="underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!consentChecked || isSubmitting}
                className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? "Sending…" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
