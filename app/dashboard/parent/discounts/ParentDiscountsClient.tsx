"use client"

import Image from "next/image"
import { Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export type ParentSponsorDiscount = {
  id: string
  title: string
  description: string
  imageUrl: string
  offerBadge: string | null
  category: string
  discountCode: string | null
  externalLink: string | null
}

type Props = {
  discounts: ParentSponsorDiscount[]
  loadError: string | null
}

export function ParentDiscountsClient({ discounts, loadError }: Props) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">Discounts</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Exclusive offers for Early Learning families. Claim a deal or copy a code when available.
        </p>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      {discounts.length === 0 && !loadError ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
          <Tag className="mx-auto h-10 w-10 text-muted-foreground/70" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">No discounts right now</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back soon for new partner offers.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {discounts.map((d) => (
            <DiscountHeroCard key={d.id} discount={d} />
          ))}
        </div>
      )}
    </div>
  )
}

function DiscountHeroCard({ discount }: { discount: ParentSponsorDiscount }) {
  const { toast } = useToast()
  const badgeText =
    discount.offerBadge?.trim() ||
    discount.category?.trim() ||
    "Offer"

  const onClaim = () => {
    const link = discount.externalLink?.trim()
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer")
      return
    }
    const code = discount.discountCode?.trim()
    if (code) {
      void navigator.clipboard.writeText(code)
      toast({
        title: "Code copied",
        description: `${code} is on your clipboard.`,
        variant: "success",
      })
      return
    }
    toast({
      title: "No link available",
      description: "This offer does not have a link or code yet.",
      variant: "destructive",
    })
  }

  return (
    <article
      className={cn(
        "group relative flex min-h-[280px] flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm",
        "transition-shadow hover:shadow-md"
      )}
    >
      <div className="relative min-h-[160px] flex-1">
        <Image
          src={discount.imageUrl || "/images/placeholder-provider.svg"}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-10">
          <span className="inline-flex rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-semibold text-amber-950">
            {badgeText}
          </span>
          <h2 className="mt-2 text-lg font-semibold leading-tight text-foreground drop-shadow-sm line-clamp-2">
            {discount.title}
          </h2>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 border-t border-border/40 bg-card p-4">
        {discount.description?.trim() ? (
          <p className="text-xs text-muted-foreground line-clamp-3">{discount.description}</p>
        ) : null}
        <Button
          type="button"
          size="sm"
          className="mt-auto w-full rounded-full"
          onClick={onClaim}
        >
          Claim Offer
        </Button>
      </div>
    </article>
  )
}
