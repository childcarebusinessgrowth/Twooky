import { RequireAuth } from "@/components/RequireAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabaseServer"
import { getFavoritesByParentProfileId } from "@/lib/parent-engagement"
import { SavedProviderCard } from "@/components/saved-provider-card"
import { LocalSavedProviders } from "@/components/local-saved-providers"
import { SavedEmptyState } from "@/components/saved-empty-state"

export default async function ParentSavedProvidersPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const favorites = user ? await getFavoritesByParentProfileId(supabase, user.id) : []

  return (
    <RequireAuth>
      <div className="space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            Your saved providers
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Keep track of daycares and preschools you&apos;re considering. You can compare
            options, send messages, and remove places once you&apos;ve decided.
          </p>
        </div>

        <Card className="border-none bg-primary/10 rounded-3xl shadow-sm shadow-primary/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 lg:p-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Tip: Save at least 3–5 providers
              </p>
              <p className="text-xs text-muted-foreground">
                Most families tour a few options before deciding. Saved providers make it easy to
                compare later.
              </p>
            </div>
            <Button asChild size="sm" className="rounded-full bg-primary hover:bg-primary/90">
              <Link href="/search">Find more providers</Link>
            </Button>
          </CardContent>
        </Card>

        {favorites.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((fav) => (
              <SavedProviderCard
                key={fav.id}
                parentProfileId={user!.id}
                favorite={fav}
              />
            ))}
          </div>
        ) : null}

        <LocalSavedProviders />

        <SavedEmptyState hasDbFavorites={favorites.length > 0} />
      </div>
    </RequireAuth>
  )
}
