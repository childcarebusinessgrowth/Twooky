/**
 * Format tuition range with optional currency symbol.
 * Defaults to $ when symbol is not provided (backward compatibility).
 */
export function formatTuitionRange(
  from: number | null,
  to: number | null,
  symbol: string = "$"
): string {
  if (from == null && to == null) return "Contact for pricing"
  const fromStr = from != null ? String(from) : "—"
  const toStr = to != null ? String(to) : "—"
  return `${symbol}${fromStr} – ${symbol}${toStr}`
}
