/**
 * Format a fee range with optional currency symbol.
 * Defaults to $ when symbol is not provided (backward compatibility).
 */
export function formatFeeRange(
  from: number | null,
  to: number | null,
  symbol: string = "$"
): string {
  if (from == null && to == null) return "Contact for pricing"
  const fromStr = from != null ? String(from) : "—"
  const toStr = to != null ? String(to) : "—"
  return `${symbol}${fromStr} – ${symbol}${toStr}`
}

export function formatDailyFeeRange(
  from: number | null,
  to: number | null,
  symbol: string = "$"
): string {
  return formatFeeRange(from, to, symbol)
}

/**
 * Backward-compatible alias retained while older imports are migrated.
 */
export function formatTuitionRange(
  from: number | null,
  to: number | null,
  symbol: string = "$"
): string {
  return formatDailyFeeRange(from, to, symbol)
}
