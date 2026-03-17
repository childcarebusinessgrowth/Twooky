import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdminClaims } from "./actions"
import { ClaimCard } from "./claim-card"
import { ProcessedClaimRow } from "./processed-claim-row"

export default async function AdminClaimsPage() {
  const { pending, processed, pendingCount, processedCount } = await getAdminClaims()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Claim Requests</h1>
        <p className="text-muted-foreground">Review and process provider ownership claims</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processed ({processedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid gap-6">
            {pending.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending claims
                </CardContent>
              </Card>
            ) : (
              pending.map((claim) => <ClaimCard key={claim.id} claim={claim} />)
            )}
          </div>
        </TabsContent>

        <TabsContent value="processed" className="mt-6">
          <Card className="border-border/50">
            <CardContent className="p-0">
              {processed.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No processed claims
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {processed.map((claim) => (
                    <ProcessedClaimRow key={claim.id} claim={claim} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
