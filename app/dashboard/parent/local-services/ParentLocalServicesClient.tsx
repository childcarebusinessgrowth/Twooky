"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Store } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type ParentLocalServiceDeal = {
  id: string
  title: string
  description: string
  imageUrl: string
  location: string
  ageTarget: string
  providerSlug: string | null
}

export type ParentAgeGroupOption = {
  id: string
  name: string
  sortOrder: number
}

type Props = {
  deals: ParentLocalServiceDeal[]
  ageGroups: ParentAgeGroupOption[]
  loadError: string | null
}

function ageTargetIncludesName(ageTarget: string, name: string): boolean {
  const needle = name.trim().toLowerCase()
  if (!needle) return true
  const tokens = ageTarget
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return tokens.some((t) => t === needle)
}

export function ParentLocalServicesClient({ deals, ageGroups, loadError }: Props) {
  const [location, setLocation] = useState<string>("all")
  const [childAge, setChildAge] = useState<string>("all")

  const locations = useMemo(() => {
    const set = new Set<string>()
    for (const d of deals) {
      const loc = d.location?.trim()
      if (loc) set.add(loc)
    }
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }, [deals])

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (location !== "all" && d.location.trim() !== location) return false
      if (childAge !== "all" && !ageTargetIncludesName(d.ageTarget, childAge)) return false
      return true
    })
  }, [deals, location, childAge])

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-1">
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
          Local Services
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Discover trusted local providers near you — swimming, baby classes, music, and more.
        </p>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2 sm:min-w-[200px]">
          <Label htmlFor="filter-location">Location</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger id="filter-location" className="rounded-xl border-border/60 bg-muted/40">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:min-w-[200px]">
          <Label htmlFor="filter-age">Child age</Label>
          <Select value={childAge} onValueChange={setChildAge}>
            <SelectTrigger id="filter-age" className="rounded-xl border-border/60 bg-muted/40">
              <SelectValue placeholder="All ages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ages</SelectItem>
              {ageGroups.map((g) => (
                <SelectItem key={g.id} value={g.name}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {deals.length === 0 && !loadError ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
          <Store className="mx-auto h-10 w-10 text-muted-foreground/70" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">No local services yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon for featured providers and deals in your area.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
          No services match your filters. Try &quot;All locations&quot; or &quot;All ages&quot;.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <LocalServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  )
}

function LocalServiceCard({ service }: { service: ParentLocalServiceDeal }) {
  const href = service.providerSlug ? `/providers/${service.providerSlug}` : null

  return (
    <Card className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-36 w-full overflow-hidden bg-muted">
        <Image
          src={service.imageUrl || "/images/placeholder-provider.svg"}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground line-clamp-2">
          {service.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="line-clamp-1">{service.location}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        {service.ageTarget?.trim() ? (
          <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-[11px] font-normal text-primary">
            {service.ageTarget}
          </Badge>
        ) : null}
        <p className="text-xs text-muted-foreground line-clamp-3">{service.description}</p>
        {href ? (
          <Button asChild size="sm" className="rounded-full w-full sm:w-auto">
            <Link href={href}>Learn more</Link>
          </Button>
        ) : (
          <Button size="sm" className="rounded-full w-full sm:w-auto" disabled title="Provider link unavailable">
            Learn more
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
