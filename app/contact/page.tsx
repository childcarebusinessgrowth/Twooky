"use client"

import { useState } from "react"

export default function ContactPage() {
  const [consentChecked, setConsentChecked] = useState(false)

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
            <form className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium tracking-wide text-foreground">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full rounded-md border border-input bg-background/80 px-3 py-2.5 text-sm placeholder:text-muted-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium tracking-wide text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-md border border-input bg-background/80 px-3 py-2.5 text-sm placeholder:text-muted-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-medium tracking-wide text-foreground">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="w-full rounded-md border border-input bg-background/80 px-3 py-2.5 text-sm placeholder:text-muted-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition"
                  placeholder="+44 20 7946 0123"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-medium tracking-wide text-foreground">
                  Message
                </label>
                <textarea
                  id="message"
                  className="w-full min-h-[120px] resize-y rounded-md border border-input bg-background/80 px-3 py-2.5 text-sm placeholder:text-muted-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition"
                  placeholder="How can we help?"
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
                disabled={!consentChecked}
                className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
