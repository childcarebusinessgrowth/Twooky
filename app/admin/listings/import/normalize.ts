import { BULK_PROVIDER_IMPORT_HEADERS } from "./importSchema"

export type BulkImportRow = Record<string, string>

export function normalizeHeader(raw: string): string {
  return raw.trim()
}

export function toRowObjectsFromGrid(grid: unknown[][]): {
  headers: string[]
  rows: BulkImportRow[]
} {
  const firstRow = grid[0] ?? []
  const headers = firstRow.map((v) => normalizeHeader(String(v ?? "")))

  const headerIndex = new Map<string, number>()
  for (let i = 0; i < headers.length; i += 1) {
    const key = headers[i]
    if (!key) continue
    if (!headerIndex.has(key)) headerIndex.set(key, i)
  }

  const supported = new Set(BULK_PROVIDER_IMPORT_HEADERS)

  const normalizedHeaders = headers.filter((h) => supported.has(h))

  const rows: BulkImportRow[] = []
  for (let r = 1; r < grid.length; r += 1) {
    const row = grid[r] ?? []
    const obj: BulkImportRow = {}
    let hasAny = false
    for (const h of normalizedHeaders) {
      const idx = headerIndex.get(h)
      if (idx == null) continue
      const raw = row[idx]
      const value = raw == null ? "" : String(raw)
      const trimmed = value.trim()
      if (trimmed) hasAny = true
      obj[h] = trimmed
    }
    if (hasAny) rows.push(obj)
  }

  return { headers: normalizedHeaders, rows }
}

export function parseBooleanLike(value: string): boolean | null {
  const v = value.trim().toLowerCase()
  if (!v) return null
  if (v === "true" || v === "1" || v === "yes" || v === "y" || v === "on") return true
  if (v === "false" || v === "0" || v === "no" || v === "n" || v === "off") return false
  return null
}

export function splitCsvList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

