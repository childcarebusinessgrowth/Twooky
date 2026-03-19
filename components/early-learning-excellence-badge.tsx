import { Award } from "lucide-react"
import { cn } from "@/lib/utils"

type EarlyLearningExcellenceBadgeProps = {
  size?: "sm" | "md"
  className?: string
}

export function EarlyLearningExcellenceBadge({
  size = "sm",
  className,
}: EarlyLearningExcellenceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold shadow-sm ring-1",
        "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/60 dark:to-yellow-950/60",
        "border-amber-300/70 dark:border-amber-600/50",
        "text-amber-800 dark:text-amber-200",
        "ring-amber-100/50 dark:ring-amber-800/30",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        className
      )}
    >
      <Award className="h-4 w-4 fill-amber-500 dark:fill-amber-400" />
      Early Learning Excellence
    </span>
  )
}
