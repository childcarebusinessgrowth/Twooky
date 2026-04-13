import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

type TopRatedBadgeProps = {
  size?: "sm" | "md"
  className?: string
}

export function TopRatedBadge({ size = "sm", className }: TopRatedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold shadow-sm ring-1",
        "bg-linear-to-r from-primary/15 via-cyan-100 to-teal-100 dark:from-primary/30 dark:via-cyan-950/50 dark:to-teal-950/60",
        "border-primary/30 dark:border-teal-600/50",
        "text-primary dark:text-cyan-100",
        "ring-primary/15 dark:ring-teal-900/40",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        className
      )}
    >
      <Star className="h-4 w-4 fill-secondary text-secondary" />
      Top Rated
    </span>
  )
}
