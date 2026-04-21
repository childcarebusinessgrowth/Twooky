export function normalizeAgeRangeLabel(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""

  const lower = trimmed.toLowerCase()
  const knownLabels: Record<string, string> = {
    infant: "0-12 months",
    infants: "0-12 months",
    toddler: "1-2 years",
    toddlers: "1-2 years",
    preschool: "3-4 years",
    prek: "4-5 years",
    "pre-k": "4-5 years",
    school: "5+",
    schoolage: "5+",
    school_age: "5+",
  }

  const directLabel = knownLabels[lower]
  if (directLabel) return directLabel

  const slugRangeMatch = lower.match(
    /(?:^|_)(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)_(weeks?|months?|years?|w|m|y)s?$/,
  )
  if (slugRangeMatch) {
    const unit = slugRangeMatch[3]
    const normalizedUnit =
      unit === "w" || unit.startsWith("week")
        ? "weeks"
        : unit === "m" || unit.startsWith("month")
          ? "months"
          : unit === "y" || unit.startsWith("year")
            ? "years"
            : unit
    return `${slugRangeMatch[1]}-${slugRangeMatch[2]} ${normalizedUnit}`
  }

  return trimmed
    .trim()
    .replace(/\s*\(/g, " (")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .replace(/\bweeks?\b/gi, "w")
    .replace(/\bmonths?\b/gi, "m")
    .replace(/\byears?\b/gi, "y")
    .replace(/\byrs?\b/gi, "y")
    .replace(/\bmos?\b/gi, "m")
    .replace(/(\d+(?:\.\d+)?)\s*\+\s*(w|m|y)\b/gi, "$1$2+")
    .replace(/\s*-\s*/g, "-")
    .replace(/(\d+(?:\.\d+)?)\s+(w|m|y)\b/gi, "$1$2")
    .replace(/_/g, " ")
    .replace(/\(\s*/g, "(")
    .replace(/\s*\)/g, ")")
}
