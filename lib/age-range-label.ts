export function normalizeAgeRangeLabel(value: string): string {
  return value
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
    .replace(/\(\s*/g, "(")
    .replace(/\s*\)/g, ")")
}
