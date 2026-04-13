export function normalizeAgeRangeLabel(value: string): string {
  return value
    .trim()
    .replace(/\s*\(/g, " (")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ")
}
