"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DIRECTORY_BADGE_ICONS,
  normalizeDirectoryBadgeColor,
  normalizeDirectoryBadgeIcon,
  type DirectoryBadgeView,
} from "@/lib/directory-badges"
import { cn } from "@/lib/utils"

const DIRECTORY_BADGE_COLOR_CLASSES = {
  emerald:
    "bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-950/60 dark:to-green-950/60 border-emerald-300/70 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-200 ring-emerald-100/50 dark:ring-emerald-800/30",
  blue:
    "bg-gradient-to-r from-primary/15 to-sky-100 dark:from-primary/25 dark:to-sky-950/50 border-primary/30 dark:border-sky-600/40 text-primary dark:text-sky-100 ring-primary/15 dark:ring-sky-900/30",
  purple:
    "bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-950/60 dark:to-purple-950/60 border-violet-300/70 dark:border-violet-600/50 text-violet-800 dark:text-violet-200 ring-violet-100/50 dark:ring-violet-800/30",
  rose:
    "bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-950/60 dark:to-pink-950/60 border-rose-300/70 dark:border-rose-600/50 text-rose-800 dark:text-rose-200 ring-rose-100/50 dark:ring-rose-800/30",
  amber:
    "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/60 dark:to-yellow-950/60 border-amber-300/70 dark:border-amber-600/50 text-amber-800 dark:text-amber-200 ring-amber-100/50 dark:ring-amber-800/30",
  slate:
    "bg-gradient-to-r from-slate-100 to-zinc-100 dark:from-slate-900/70 dark:to-zinc-900/70 border-slate-300/70 dark:border-slate-600/50 text-slate-800 dark:text-slate-200 ring-slate-100/50 dark:ring-slate-800/30",
  teal:
    "bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-950/60 dark:to-cyan-950/60 border-teal-300/70 dark:border-teal-600/50 text-teal-800 dark:text-teal-200 ring-teal-100/50 dark:ring-teal-800/30",
  indigo:
    "bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-950/60 dark:to-blue-950/60 border-indigo-300/70 dark:border-indigo-600/50 text-indigo-800 dark:text-indigo-200 ring-indigo-100/50 dark:ring-indigo-800/30",
  orange:
    "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-950/60 dark:to-amber-950/60 border-orange-300/70 dark:border-orange-600/50 text-orange-800 dark:text-orange-200 ring-orange-100/50 dark:ring-orange-800/30",
  lime:
    "bg-gradient-to-r from-lime-100 to-green-100 dark:from-lime-950/60 dark:to-green-950/60 border-lime-300/70 dark:border-lime-600/50 text-lime-800 dark:text-lime-200 ring-lime-100/50 dark:ring-lime-800/30",
} as const

type DirectoryBadgeProps = {
  badge: Pick<DirectoryBadgeView, "name" | "description" | "color" | "icon">
  size?: "sm" | "md"
  className?: string
}

export function DirectoryBadge({ badge, size = "sm", className }: DirectoryBadgeProps) {
  const normalizedColor = normalizeDirectoryBadgeColor(badge.color)
  const normalizedIcon = normalizeDirectoryBadgeIcon(badge.icon)
  const Icon = DIRECTORY_BADGE_ICONS[normalizedIcon]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border font-semibold shadow-sm ring-1",
            DIRECTORY_BADGE_COLOR_CLASSES[normalizedColor],
            size === "sm" && "px-3 py-1.5 text-xs",
            size === "md" && "px-4 py-2 text-sm",
            className,
          )}
        >
          <Icon className="h-4 w-4" />
          {badge.name}
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{badge.description}</TooltipContent>
    </Tooltip>
  )
}
