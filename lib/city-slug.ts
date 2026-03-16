/**
 * Normalize a city name to a URL-safe slug (e.g. "Abu Dhabi" → "abu-dhabi").
 * Used when creating new cities in the locations directory.
 */
export function slugifyCityName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
