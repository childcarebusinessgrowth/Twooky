import { Award, BadgeCheck, Crown, Gem, Heart, Rocket, ShieldCheck, Sparkles, Star, ThumbsUp } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const DIRECTORY_BADGE_COLORS = [
  "emerald",
  "blue",
  "purple",
  "rose",
  "amber",
  "slate",
  "teal",
  "indigo",
  "orange",
  "lime",
] as const

export type DirectoryBadgeColor = (typeof DIRECTORY_BADGE_COLORS)[number]

export const DIRECTORY_BADGE_ICONS = {
  award: Award,
  badgeCheck: BadgeCheck,
  crown: Crown,
  heart: Heart,
  gem: Gem,
  rocket: Rocket,
  shieldCheck: ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  thumbsUp: ThumbsUp,
} as const satisfies Record<string, LucideIcon>

export type DirectoryBadgeIcon = keyof typeof DIRECTORY_BADGE_ICONS

export type DirectoryBadgeRecord = {
  id: string
  name: string
  description: string
  color: string
  icon: string
  is_active: boolean
}

export type DirectoryBadgeView = {
  id: string
  name: string
  description: string
  color: DirectoryBadgeColor
  icon: DirectoryBadgeIcon
}

export type DirectoryBadgeRelationRow = {
  id: string
  name: string
  description: string
  color: string
  icon: string
}

export function normalizeDirectoryBadgeColor(color: string | null | undefined): DirectoryBadgeColor {
  if (color && DIRECTORY_BADGE_COLORS.includes(color as DirectoryBadgeColor)) {
    return color as DirectoryBadgeColor
  }
  return "blue"
}

export function normalizeDirectoryBadgeIcon(icon: string | null | undefined): DirectoryBadgeIcon {
  if (icon && Object.hasOwn(DIRECTORY_BADGE_ICONS, icon)) {
    return icon as DirectoryBadgeIcon
  }
  return "award"
}

export function toDirectoryBadgeView(
  badge: Pick<DirectoryBadgeRecord, "id" | "name" | "description" | "color" | "icon">,
): DirectoryBadgeView {
  return {
    id: badge.id,
    name: badge.name,
    description: badge.description,
    color: normalizeDirectoryBadgeColor(badge.color),
    icon: normalizeDirectoryBadgeIcon(badge.icon),
  }
}

export function extractDirectoryBadgeRelation(
  value: DirectoryBadgeRelationRow | DirectoryBadgeRelationRow[] | null | undefined,
): DirectoryBadgeRelationRow | null {
  if (!value) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}
