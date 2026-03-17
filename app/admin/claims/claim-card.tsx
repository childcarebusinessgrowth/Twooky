"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { FileText, Mail, Phone, Building2, Check, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { AdminClaimRow } from "./actions"
import { approveClaim, rejectClaim } from "./actions"

export function ClaimCard({ claim }: { claim: AdminClaimRow }) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  async function handleApprove() {
    setIsApproving(true)
    const result = await approveClaim(claim.id)
    setIsApproving(false)
    if (result.success) router.refresh()
  }

  async function handleReject() {
    setIsRejecting(true)
    const result = await rejectClaim(claim.id)
    setIsRejecting(false)
    if (result.success) router.refresh()
  }

  const submittedAt = new Date(claim.submitted_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{claim.business_name}</CardTitle>
            <CardDescription>Submitted {submittedAt}</CardDescription>
          </div>
          <Badge variant="secondary">Pending Review</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Claimant</p>
            <p className="font-medium">{claim.claimant_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Business Address</p>
            <p className="text-sm">{claim.business_address}</p>
          </div>
        </div>

        {claim.match_status && (
          <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Match</p>
            <p className="text-sm">
              {claim.match_status === "auto_matched" && "High confidence match"}
              {claim.match_status === "possible_match" && "Possible match"}
              {claim.match_status === "unmatched" && "No match found"}
              {claim.match_score != null && ` (${Math.round(claim.match_score * 100)}%)`}
              {claim.matched_business_name && ` → ${claim.matched_business_name}`}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm">
          <a href={`mailto:${claim.email}`} className="flex items-center gap-2 text-primary hover:underline">
            <Mail className="h-4 w-4" />
            {claim.email}
          </a>
          <a href={`tel:${claim.phone}`} className="flex items-center gap-2 text-primary hover:underline">
            <Phone className="h-4 w-4" />
            {claim.phone}
          </a>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Verification Documents</p>
          <div className="flex flex-wrap gap-2">
            {claim.documents.map((doc) => (
              <Button
                key={doc.id}
                variant="outline"
                size="sm"
                className="h-8"
                asChild
              >
                <a
                  href={doc.signed_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {doc.document_type}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="flex-1" disabled={isApproving || isRejecting}>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Claim Request</AlertDialogTitle>
                <AlertDialogDescription>
                  This will approve the claim from {claim.claimant_name} for {claim.business_name}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleApprove()} disabled={isApproving}>
                  Approve Claim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1" disabled={isApproving || isRejecting}>
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Claim Request</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reject the claim request from {claim.claimant_name} for {claim.business_name}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => void handleReject()}
                  disabled={isRejecting}
                >
                  Reject Claim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
