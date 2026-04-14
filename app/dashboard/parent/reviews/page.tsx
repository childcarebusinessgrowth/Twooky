import { RequireAuth } from "@/components/RequireAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getReviewsByParentProfileId } from "@/lib/parent-engagement"
import { ParentReviewCard } from "@/components/parent-review-card"

export default async function ParentReviewsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const parentProfileId = user?.id ?? null
  const reviews = user ? await getReviewsByParentProfileId(supabase, user.id) : []

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-4xl space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            My reviews
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Your reviews help other parents make confident decisions. You can edit or remove
            anything you&apos;ve shared.
          </p>
        </div>

        <Card className="rounded-2xl border border-secondary/20 bg-secondary/5 shadow-sm shadow-secondary/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 lg:p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Remember: honest, specific feedback is most helpful
              </p>
              <p className="text-xs text-muted-foreground">
                Share what you loved, what could be better, and any details about communication,
                cleanliness, or curriculum.
              </p>
            </div>
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90" asChild>
              <Link href="/search">Find a provider to review</Link>
            </Button>
          </CardContent>
        </Card>

        {reviews.length > 0 && parentProfileId ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ParentReviewCard
                key={review.id}
                parentProfileId={parentProfileId}
                review={review}
              />
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border border-border/60">
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="font-medium text-foreground">No reviews yet</p>
              <p className="mt-1 text-sm">
                Visit a provider&apos;s profile and use the Reviews tab to write your first
                review.
              </p>
              <Button asChild size="sm" className="mt-4 rounded-full">
                <Link href="/search">Search providers</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </RequireAuth>
  )
}
