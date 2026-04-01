import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export const VERIFIED_BADGE_COLORS = [
  "emerald",
  "blue",
  "purple",
  "rose",
  "amber",
] as const

export type VerifiedBadgeColor = (typeof VERIFIED_BADGE_COLORS)[number]

const VERIFIED_BADGE_COLOR_CLASSES: Record<VerifiedBadgeColor, string> = {
  emerald:
    "bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-950/60 dark:to-green-950/60 border-emerald-300/70 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-200 ring-emerald-100/50 dark:ring-emerald-800/30",
  blue:
    "bg-gradient-to-r from-primary/15 to-teal-100 dark:from-primary/25 dark:to-teal-950/50 border-primary/30 dark:border-teal-600/40 text-primary dark:text-teal-100 ring-primary/15 dark:ring-teal-900/30",
  purple:
    "bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-950/60 dark:to-purple-950/60 border-violet-300/70 dark:border-violet-600/50 text-violet-800 dark:text-violet-200 ring-violet-100/50 dark:ring-violet-800/30",
  rose:
    "bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-950/60 dark:to-pink-950/60 border-rose-300/70 dark:border-rose-600/50 text-rose-800 dark:text-rose-200 ring-rose-100/50 dark:ring-rose-800/30",
  amber:
    "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/60 dark:to-yellow-950/60 border-amber-300/70 dark:border-amber-600/50 text-amber-800 dark:text-amber-200 ring-amber-100/50 dark:ring-amber-800/30",
}

type VerifiedProviderBadgeProps = {
  size?: "sm" | "md"
  color?: string | null
  className?: string
}

function normalizeBadgeColor(color: string | null | undefined): VerifiedBadgeColor {
  if (!color) return "emerald"
  if (VERIFIED_BADGE_COLORS.includes(color as VerifiedBadgeColor)) {
    return color as VerifiedBadgeColor
  }
  return "emerald"
}

export function VerifiedProviderBadge({
  size = "sm",
  color,
  className,
}: VerifiedProviderBadgeProps) {
  const normalizedColor = normalizeBadgeColor(color)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold shadow-sm ring-1",
        VERIFIED_BADGE_COLOR_CLASSES[normalizedColor],
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        className
      )}
    >
      <BadgeCheck className="h-4 w-4" />
      Verified Provider
    </span>
  )
}
