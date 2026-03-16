"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DateRangeKey = "7d" | "30d" | "90d" | "12m"

const OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 3 months" },
  { value: "12m", label: "Last 12 months" },
]

type AdminAnalyticsDateRangeSelectProps = {
  value: DateRangeKey
}

export function AdminAnalyticsDateRangeSelect({ value }: AdminAnalyticsDateRangeSelectProps) {
  const router = useRouter()
  const pathname = usePathname()

  function onValueChange(newValue: DateRangeKey) {
    const params = new URLSearchParams()
    params.set("range", newValue)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Date range" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
