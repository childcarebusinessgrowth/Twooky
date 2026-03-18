"use client"

import { RequireAuth } from "@/components/RequireAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Store, Tag, Copy, Check, Construction } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MOCK_LOCAL_SERVICES,
  MOCK_PARENT_DISCOUNTS,
  type LocalService,
  type ParentDiscount,
} from "@/lib/mock-local-services"

function LocalServiceCard({ service }: { service: LocalService }) {
  return (
    <Card className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="h-36 w-full overflow-hidden bg-muted relative flex items-center justify-center">
        <Image
          src="/images/placeholder-provider.svg"
          alt=""
          fill
          className="object-cover opacity-60"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <CardHeader className="pb-2">
        <Badge
          variant="outline"
          className="w-fit rounded-full border-primary/20 bg-primary/10 text-[11px] text-primary mb-1"
        >
          {service.category}
        </Badge>
        <CardTitle className="text-base font-semibold text-foreground line-clamp-1">
          {service.name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>{service.location}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
        <Button
          asChild
          size="sm"
          className="rounded-full w-full sm:w-auto"
        >
          <Link href={service.ctaUrl ?? "#"}>{service.ctaLabel ?? "Learn more"}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function DiscountCard({ discount }: { discount: ParentDiscount }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    if (discount.code) {
      void navigator.clipboard.writeText(discount.code)
      setCopied(true)
      toast({
        title: "Code copied",
        description: `${discount.code} copied to clipboard.`,
        variant: "success",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="rounded-3xl border border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="border-l-4 border-l-secondary bg-secondary/5 px-4 py-3">
        <Badge
          variant="outline"
          className="rounded-full border-secondary/30 bg-secondary/10 text-secondary text-[11px] font-semibold mb-2"
        >
          {discount.offer}
        </Badge>
        <CardTitle className="text-base font-semibold text-foreground">
          {discount.companyName}
        </CardTitle>
        {discount.category && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{discount.category}</p>
        )}
      </div>
      <CardContent className="space-y-3 pt-4">
        {discount.description && (
          <p className="text-xs text-muted-foreground">{discount.description}</p>
        )}
        {discount.expiry && (
          <p className="text-[11px] text-muted-foreground/80">Valid: {discount.expiry}</p>
        )}
        {discount.code && (
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-3 py-2 text-xs font-mono font-medium text-foreground">
              {discount.code}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 rounded-full h-8 w-8 p-0"
              onClick={handleCopyCode}
              aria-label="Copy code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
        <Button asChild size="sm" variant="outline" className="rounded-full w-full sm:w-auto border-secondary/30 text-secondary hover:bg-secondary/10 hover:border-secondary/50">
          <Link href="#">Claim offer</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function ParentLocalServicesPage() {
  return (
    <RequireAuth>
      <div className="space-y-6 lg:space-y-8">
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            Local Services & Deals
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Discover trusted local providers and exclusive discounts for Early Learning families.
            Swimming schools, baby classes, music, and more — all in one place.
          </p>
        </div>

        <Alert className="rounded-2xl border-amber-500/30 bg-amber-500/5">
          <Construction className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            This page uses fake data for now and is under development. Real local services and discounts will be available soon.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="local-services" className="space-y-6">
          <TabsList className="rounded-full bg-muted/70 p-1 h-auto">
            <TabsTrigger
              value="local-services"
              className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Store className="h-4 w-4 mr-2" />
              Local Services
            </TabsTrigger>
            <TabsTrigger
              value="discounts"
              className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Tag className="h-4 w-4 mr-2" />
              Discounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local-services" className="space-y-4 mt-0">
            <p className="text-sm text-muted-foreground">
              Discover trusted local providers near you — swimming, baby classes, music, and more.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MOCK_LOCAL_SERVICES.map((service) => (
                <LocalServiceCard key={service.id} service={service} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="discounts" className="space-y-4 mt-0">
            <p className="text-sm text-muted-foreground">
              Exclusive deals for Early Learning families. Create an account to unlock.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MOCK_PARENT_DISCOUNTS.map((discount) => (
                <DiscountCard key={discount.id} discount={discount} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAuth>
  )
}
