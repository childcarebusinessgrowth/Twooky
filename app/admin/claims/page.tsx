"use client"

import { FileText, Mail, Phone, Building2, Check, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const claimRequests = [
  {
    id: 1,
    providerName: "Happy Kids Academy",
    claimantName: "Jennifer Smith",
    email: "jennifer@happykidsacademy.com",
    phone: "(555) 123-4567",
    businessAddress: "456 Oak Street, San Jose, CA 95112",
    documents: ["Business License", "ID Verification"],
    submittedAt: "Mar 10, 2026",
    status: "pending"
  },
  {
    id: 2,
    providerName: "Little Explorers Daycare",
    claimantName: "Mark Johnson",
    email: "mark@littleexplorers.com",
    phone: "(555) 234-5678",
    businessAddress: "789 Pine Avenue, Oakland, CA 94612",
    documents: ["Business License", "Utility Bill", "ID Verification"],
    submittedAt: "Mar 9, 2026",
    status: "pending"
  },
  {
    id: 3,
    providerName: "Tiny Treasures Learning",
    claimantName: "Lisa Chen",
    email: "lisa@tinytreasures.com",
    phone: "(555) 345-6789",
    businessAddress: "321 Elm Road, Fremont, CA 94536",
    documents: ["Business License"],
    submittedAt: "Mar 8, 2026",
    status: "pending"
  },
]

const processedClaims = [
  {
    id: 4,
    providerName: "Bright Futures Learning",
    claimantName: "David Martinez",
    email: "david@brightfutures.com",
    submittedAt: "Mar 5, 2026",
    processedAt: "Mar 7, 2026",
    status: "approved"
  },
  {
    id: 5,
    providerName: "Kidz World Academy",
    claimantName: "Amy Wilson",
    email: "amy@kidzworld.com",
    submittedAt: "Mar 3, 2026",
    processedAt: "Mar 6, 2026",
    status: "rejected",
    reason: "Invalid business license"
  },
  {
    id: 6,
    providerName: "Rainbow Kids Center",
    claimantName: "Robert Lee",
    email: "robert@rainbowkids.com",
    submittedAt: "Mar 1, 2026",
    processedAt: "Mar 4, 2026",
    status: "approved"
  },
]

function ClaimCard({ claim }: { claim: typeof claimRequests[0] }) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{claim.providerName}</CardTitle>
            <CardDescription>Submitted {claim.submittedAt}</CardDescription>
          </div>
          <Badge variant="secondary">Pending Review</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Claimant info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Claimant</p>
            <p className="font-medium">{claim.claimantName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Business Address</p>
            <p className="text-sm">{claim.businessAddress}</p>
          </div>
        </div>

        {/* Contact info */}
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

        {/* Documents */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Verification Documents</p>
          <div className="flex flex-wrap gap-2">
            {claim.documents.map((doc) => (
              <Button key={doc} variant="outline" size="sm" className="h-8">
                <FileText className="h-4 w-4 mr-2" />
                {doc}
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Claim Request</AlertDialogTitle>
                <AlertDialogDescription>
                  This will grant {claim.claimantName} ownership of the {claim.providerName} listing. They will be able to edit all listing details and respond to reviews.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Approve Claim</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Claim Request</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reject the claim request from {claim.claimantName} for {claim.providerName}. They will be notified via email.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

export default function AdminClaimsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Claim Requests</h1>
        <p className="text-muted-foreground">Review and process provider ownership claims</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({claimRequests.length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processed ({processedClaims.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid gap-6">
            {claimRequests.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="processed" className="mt-6">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {processedClaims.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{claim.providerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {claim.claimantName} · Processed {claim.processedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {claim.status === "rejected" && claim.reason && (
                        <span className="text-sm text-muted-foreground hidden sm:block">
                          {claim.reason}
                        </span>
                      )}
                      <Badge 
                        variant={claim.status === "approved" ? "default" : "destructive"}
                        className={claim.status === "approved" ? "bg-primary" : ""}
                      >
                        {claim.status === "approved" ? "Approved" : "Rejected"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
