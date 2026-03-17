"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, BadgeCheck, Clock3, FileText, Shield, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseClient } from "@/lib/supabaseClient"
import { CLAIM_DOCUMENTS_BUCKET, MAX_FILE_SIZE_BYTES } from "@/lib/claim-listing-constants"

const DOCUMENT_TYPES = [
  "Business License",
  "ID Verification",
  "Utility Bill",
  "Other",
] as const

export function ClaimListingForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")

  async function handleSubmit(formData: FormData) {
    setStatus("submitting")
    setErrorMessage("")
    try {
      const files = formData.getAll("documents") as File[]
      const validFiles = files.filter((f) => f && f.size > 0 && f.name)
      if (validFiles.length === 0) {
        setStatus("error")
        setErrorMessage("At least one verification document is required.")
        return
      }
      for (const f of validFiles) {
        if (f.size > MAX_FILE_SIZE_BYTES) {
          setStatus("error")
          setErrorMessage(`File "${f.name}" exceeds 10MB limit.`)
          return
        }
      }

      const initRes = await fetch("/api/claim-listing/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimant_name: formData.get("claimant_name")?.toString()?.trim(),
          business_name: formData.get("business_name")?.toString()?.trim(),
          email: formData.get("email")?.toString()?.trim(),
          phone: formData.get("phone")?.toString()?.trim(),
          business_address: formData.get("business_address")?.toString()?.trim(),
          consent: formData.get("consent") === "on",
          document_type: formData.get("document_type")?.toString() ?? "Other",
          files: validFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        }),
      })
      const initJson = await initRes.json()
      if (!initJson.success) {
        setStatus("error")
        setErrorMessage(initJson.error ?? "Something went wrong.")
        return
      }

      const { claimId, uploads } = initJson
      const supabase = getSupabaseClient()
      for (let i = 0; i < validFiles.length; i++) {
        const { path, token } = uploads[i]
        const file = validFiles[i]
        const { error: uploadError } = await supabase.storage
          .from(CLAIM_DOCUMENTS_BUCKET)
          .uploadToSignedUrl(path, token, file, { contentType: file.type })
        if (uploadError) {
          setStatus("error")
          setErrorMessage(`Failed to upload "${file.name}": ${uploadError.message}`)
          return
        }
      }

      const completeRes = await fetch("/api/claim-listing/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId,
          document_type: formData.get("document_type")?.toString() ?? "Other",
          documents: validFiles.map((f, i) => ({
            path: uploads[i].path,
            mime_type: f.type,
            file_size: f.size,
          })),
        }),
      })
      const completeJson = await completeRes.json()
      if (completeJson.success) {
        setStatus("success")
      } else {
        setStatus("error")
        setErrorMessage(completeJson.error ?? "Something went wrong.")
      }
    } catch (e) {
      setStatus("error")
      const isNetworkError =
        e instanceof TypeError &&
        (e.message === "Failed to fetch" || e.message === "fetch failed")
      setErrorMessage(
        isNetworkError
          ? "Unable to connect. Please check your connection and try again."
          : e instanceof Error
            ? e.message
            : "An unexpected error occurred."
      )
    }
  }

  if (status === "success") {
    return (
      <Card
        id="claim-form"
        className="border-border/70 bg-card/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm"
      >
        <CardHeader className="space-y-3 pb-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Submission Received
          </div>
          <CardTitle className="text-2xl">Thank you</CardTitle>
          <p className="text-muted-foreground">
            The admin will check your request. You can expect a response within 1 business day.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We&apos;ve received your claim and verification documents. Our team will review your
            submission and contact you at the email address you provided.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      id="claim-form"
      className="border-border/70 bg-card/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)] backdrop-blur-sm"
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <BadgeCheck className="h-3.5 w-3.5" />
          Free Listing Setup
        </div>
        <CardTitle className="text-2xl">Claim Your Free Listing</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete this quick form and our team will help verify your listing so you can start
          receiving parent inquiries.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit(new FormData(e.currentTarget))
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="claimant_name">Your Name</Label>
            <Input
              id="claimant_name"
              name="claimant_name"
              placeholder="Jane Smith"
              required
              disabled={status === "submitting"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              name="business_name"
              placeholder="Your childcare center name"
              required
              disabled={status === "submitting"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                disabled={status === "submitting"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 123-4567"
                required
                disabled={status === "submitting"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <Input
              id="address"
              name="business_address"
              placeholder="123 Main Street, City, State"
              required
              disabled={status === "submitting"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type</Label>
            <select
              id="document_type"
              name="document_type"
              required
              disabled={status === "submitting"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documents">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Verification Documents (at least one required)
              </span>
            </Label>
            <Input
              id="documents"
              name="documents"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              multiple
              required
              disabled={status === "submitting"}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              PDF or images (JPEG, PNG, WebP). Max 10MB per file.
            </p>
          </div>

          <label
            htmlFor="claim-consent"
            className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
          >
            <input
              id="claim-consent"
              name="consent"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              required
              disabled={status === "submitting"}
            />
            <span>
              I consent to processing this claim request and contact details under the{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {status === "error" && errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Submitting…" : "Claim Your Listing"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>

        <div className="grid grid-cols-1 gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
          <p className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            Average first response within 1 business day
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            No obligation or payment required to submit
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By claiming your listing, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  )
}
