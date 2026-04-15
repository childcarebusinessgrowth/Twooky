"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, Loader2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { type PlanId } from "@/lib/pricing-data"
import { updateProviderPlan, type AdminProviderPlanRow, type ProviderPlanFilter } from "./actions"

type Props = {
  rows: AdminProviderPlanRow[]
  total: number
  page: number
  pageSize: number
  searchQuery: string
  planFilter: ProviderPlanFilter
  plans: { id: PlanId; name: string }[]
}

function getStatusBadgeClassName(status: string) {
  if (status === "active") return "bg-emerald-600/90 text-white hover:bg-emerald-600/90"
  if (status === "inactive") return "bg-slate-500/90 text-white hover:bg-slate-500/90"
  return "bg-amber-500/90 text-white hover:bg-amber-500/90"
}

function formatBillingDateLabel(value: string | null, cancelAtPeriodEnd: boolean): string | null {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return `${cancelAtPeriodEnd ? "Access ends" : "Renews"} ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`
}

function joinDetailParts(parts: Array<string | null | undefined>): string | null {
  const filtered = parts.map((part) => part?.trim()).filter(Boolean)
  return filtered.length > 0 ? filtered.join(" • ") : null
}

function getPaymentBadgeClassName(row: AdminProviderPlanRow, isExactPaidMatch: boolean): string {
  if (row.plan_id === "sprout" || row.plan_id === "kinderpathPro") {
    return "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
  }
  if (isExactPaidMatch) {
    return "bg-emerald-600/90 text-white hover:bg-emerald-600/90"
  }
  return "bg-amber-500/90 text-white hover:bg-amber-500/90"
}

function getPaymentSummary(row: AdminProviderPlanRow, planNameById: Record<PlanId, string>) {
  const renewalLabel = formatBillingDateLabel(
    row.billing_current_period_end,
    row.billing_cancel_at_period_end,
  )
  const isExactPaidMatch = row.has_paid_subscription && row.billing_plan_id === row.plan_id

  if (row.plan_id === "sprout") {
    return {
      label: "Free plan",
      detail: "No Stripe payment required.",
      className: getPaymentBadgeClassName(row, isExactPaidMatch),
    }
  }

  if (row.plan_id === "kinderpathPro") {
    return {
      label: "Outside Stripe",
      detail: "Managed outside Stripe.",
      className: getPaymentBadgeClassName(row, isExactPaidMatch),
    }
  }

  if (isExactPaidMatch) {
    return {
      label: "Paid",
      detail: joinDetailParts([row.billing_status_label, row.billing_interval_label, renewalLabel]),
      className: getPaymentBadgeClassName(row, isExactPaidMatch),
    }
  }

  if (row.has_paid_subscription && row.billing_plan_id && row.billing_plan_id !== row.plan_id) {
    return {
      label: `Paid for ${planNameById[row.billing_plan_id]}`,
      detail: joinDetailParts([
        `Assigned ${planNameById[row.plan_id]}`,
        row.billing_status_label,
        row.billing_interval_label,
        renewalLabel,
      ]),
      className: getPaymentBadgeClassName(row, isExactPaidMatch),
    }
  }

  return {
    label: "Not paid",
    detail: row.has_stripe_subscription
      ? joinDetailParts([row.billing_status_label ?? "Stripe subscription on file", renewalLabel])
      : "No Stripe subscription on file.",
    className: getPaymentBadgeClassName(row, isExactPaidMatch),
  }
}

export function AdminProviderPlansPageClient({
  rows,
  total,
  page,
  pageSize,
  searchQuery,
  planFilter,
  plans,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [updatingProfileId, setUpdatingProfileId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const planNameById = useMemo(
    () => Object.fromEntries(plans.map((plan) => [plan.id, plan.name])),
    [plans]
  ) as Record<PlanId, string>

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    const nextSearch = localSearch.trim()
    const currentSearch = searchParams.get("search")?.trim() ?? ""
    if (nextSearch === currentSearch) return

    const timeoutId = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString())
      next.set("page", "1")
      if (nextSearch) next.set("search", nextSearch)
      else next.delete("search")
      router.replace(`/admin/provider-plans?${next.toString()}`, { scroll: false })
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [localSearch, router, searchParams])

  const setPlanFilterValue = (value: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", "1")
    if (value !== "all") next.set("plan", value)
    else next.delete("plan")
    router.push(`/admin/provider-plans?${next.toString()}`)
  }

  const clearFilters = () => {
    setLocalSearch("")
    router.push("/admin/provider-plans")
  }

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("page", String(nextPage))
    router.push(`/admin/provider-plans?${next.toString()}`)
  }

  const handlePlanChange = (profileId: string, value: string) => {
    const nextPlan = value as PlanId
    setUpdatingProfileId(profileId)

    startTransition(async () => {
      try {
        await updateProviderPlan(profileId, nextPlan)
        toast({
          title: `Assigned ${planNameById[nextPlan]}`,
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Could not update plan",
          description: error instanceof Error ? error.message : "Something went wrong.",
          variant: "destructive",
        })
      } finally {
        setUpdatingProfileId(null)
      }
    })
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CreditCard className="h-6 w-6" />
          Provider Plans
        </h1>
        <p className="text-muted-foreground">
          Assign plans for provider features and review Stripe payment status separately.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-2">
              <label htmlFor="provider-plan-search" className="text-sm font-medium text-foreground">
                Search providers
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="provider-plan-search"
                  value={localSearch}
                  onChange={(event) => setLocalSearch(event.target.value)}
                  placeholder="Search by provider, slug, or city"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Plan</span>
              <Select value={planFilter} onValueChange={setPlanFilterValue}>
                <SelectTrigger>
                  <SelectValue placeholder="All plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-0">
          <div className="flex items-center justify-between px-4 pt-4 text-sm text-muted-foreground">
            <span>
              Showing {from}-{to} of {total} providers
            </span>
            {isPending && updatingProfileId ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving plan…
              </span>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="min-w-[220px]">Assigned plan</TableHead>
                  <TableHead className="min-w-[220px]">Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No providers matched the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const rowIsUpdating = isPending && updatingProfileId === row.profile_id
                    const paymentSummary = getPaymentSummary(row, planNameById)

                    return (
                      <TableRow key={row.profile_id}>
                        <TableCell>
                          <div className="space-y-1">
                            <Link
                              href={`/admin/listings/${row.profile_id}`}
                              className="font-medium text-foreground hover:underline"
                            >
                              {row.business_name?.trim() || "Unnamed provider"}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {row.provider_slug ? `/${row.provider_slug}` : row.profile_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{row.city?.trim() || "—"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClassName(row.listing_status)}>
                            {row.listing_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.featured ? "default" : "secondary"}>
                            {row.featured ? "Featured" : "Standard"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.plan_id}
                            onValueChange={(value) => handlePlanChange(row.profile_id, value)}
                            disabled={rowIsUpdating}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={paymentSummary.className}>{paymentSummary.label}</Badge>
                            {paymentSummary.detail ? (
                              <p className="text-xs text-muted-foreground">{paymentSummary.detail}</p>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
