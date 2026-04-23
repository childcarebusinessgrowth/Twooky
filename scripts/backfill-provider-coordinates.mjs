#!/usr/bin/env node
// Backfill provider_profiles.latitude/longitude for rows missing coordinates.
//
// Usage:
//   node --env-file=.env.local scripts/backfill-provider-coordinates.mjs [--limit=500] [--dry-run]
//
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and either
// GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.

import { createClient } from "@supabase/supabase-js"
import { writeFileSync } from "node:fs"

const args = process.argv.slice(2)
function readFlag(name, defaultValue) {
  const match = args.find((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`))
  if (!match) return defaultValue
  if (match === `--${name}`) return true
  return match.slice(name.length + 3)
}

const LIMIT = Number(readFlag("limit", "0")) || 0
const DRY_RUN = Boolean(readFlag("dry-run", false))
const CONCURRENCY = Math.max(1, Math.min(8, Number(readFlag("concurrency", "4"))))
const DELAY_MS = Math.max(0, Number(readFlag("delay-ms", "80")))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GOOGLE_KEY =
  (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY.trim()) ||
  (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim())

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
  process.exit(1)
}
if (!GOOGLE_KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY / NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function isValidCoordinates(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return false
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false
  if (lat === 0 && lng === 0) return false
  return true
}

async function fetchPlaceDetailsCoords(placeId) {
  if (!placeId) return null
  const url = `https://maps.googleapis.com/maps/api/place/details/json?${new URLSearchParams({
    placeid: placeId,
    fields: "geometry/location",
    key: GOOGLE_KEY,
  })}`
  const response = await fetch(url, { method: "GET" }).catch(() => null)
  if (!response || !response.ok) return null
  const payload = await response.json().catch(() => null)
  if (!payload || payload.status !== "OK") return null
  const location = payload.result?.geometry?.location
  if (!location) return null
  const lat = Number(location.lat)
  const lng = Number(location.lng)
  if (!isValidCoordinates(lat, lng)) return null
  return { lat, lng }
}

async function geocodeAddress(address) {
  if (!address) return null
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${new URLSearchParams({
    address,
    key: GOOGLE_KEY,
  })}`
  const response = await fetch(url, { method: "GET" }).catch(() => null)
  if (!response || !response.ok) return null
  const payload = await response.json().catch(() => null)
  if (!payload || payload.status !== "OK" || !payload.results?.length) return null
  const location = payload.results[0]?.geometry?.location
  if (!location) return null
  const lat = Number(location.lat)
  const lng = Number(location.lng)
  if (!isValidCoordinates(lat, lng)) return null
  return { lat, lng }
}

async function resolveCoords(row) {
  if (row.google_place_id) {
    const viaPlace = await fetchPlaceDetailsCoords(row.google_place_id)
    if (viaPlace) return { coords: viaPlace, source: "place-details" }
  }
  const query = [row.business_name, row.address, row.city].filter(Boolean).join(", ")
  if (!query) return null
  const viaGeocode = await geocodeAddress(query)
  if (viaGeocode) return { coords: viaGeocode, source: "geocode" }
  return null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function loadCandidates() {
  const { data, error } = await supabase
    .from("provider_profiles")
    .select("profile_id, business_name, address, city, google_place_id, latitude, longitude")
    .or("latitude.is.null,longitude.is.null")

  if (error) throw new Error(`Failed to load provider rows: ${error.message}`)
  const rows = data ?? []
  if (LIMIT > 0) return rows.slice(0, LIMIT)
  return rows
}

async function main() {
  console.log(
    `[backfill-coords] starting (dry-run=${DRY_RUN}, concurrency=${CONCURRENCY}, delay=${DELAY_MS}ms)`,
  )
  const candidates = await loadCandidates()
  console.log(`[backfill-coords] found ${candidates.length} provider(s) missing coordinates`)

  const stats = { total: candidates.length, ok: 0, failed: 0, skipped: 0 }
  const failures = []

  let index = 0
  async function worker() {
    while (true) {
      const current = index
      index += 1
      if (current >= candidates.length) return
      const row = candidates[current]
      const label = row.business_name || row.profile_id
      try {
        const resolved = await resolveCoords(row)
        if (!resolved) {
          stats.failed += 1
          failures.push({
            profile_id: row.profile_id,
            business_name: row.business_name,
            address: row.address,
            city: row.city,
            reason: "no coordinates returned",
          })
          console.log(`  [${current + 1}/${candidates.length}] MISS  ${label}`)
        } else if (DRY_RUN) {
          stats.skipped += 1
          console.log(
            `  [${current + 1}/${candidates.length}] DRY  ${label} => ${resolved.coords.lat}, ${resolved.coords.lng} (${resolved.source})`,
          )
        } else {
          const { error } = await supabase
            .from("provider_profiles")
            .update({ latitude: resolved.coords.lat, longitude: resolved.coords.lng })
            .eq("profile_id", row.profile_id)
          if (error) {
            stats.failed += 1
            failures.push({
              profile_id: row.profile_id,
              business_name: row.business_name,
              address: row.address,
              city: row.city,
              reason: `update failed: ${error.message}`,
            })
            console.log(`  [${current + 1}/${candidates.length}] FAIL  ${label} (${error.message})`)
          } else {
            stats.ok += 1
            console.log(
              `  [${current + 1}/${candidates.length}] OK   ${label} => ${resolved.coords.lat}, ${resolved.coords.lng} (${resolved.source})`,
            )
          }
        }
      } catch (error) {
        stats.failed += 1
        const reason = error instanceof Error ? error.message : String(error)
        failures.push({
          profile_id: row.profile_id,
          business_name: row.business_name,
          address: row.address,
          city: row.city,
          reason,
        })
        console.log(`  [${current + 1}/${candidates.length}] ERR  ${label} (${reason})`)
      }
      if (DELAY_MS > 0) await sleep(DELAY_MS)
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker())
  await Promise.all(workers)

  console.log("[backfill-coords] done")
  console.log(
    `  total=${stats.total} ok=${stats.ok} failed=${stats.failed} skipped=${stats.skipped}`,
  )

  if (failures.length > 0) {
    const header = "profile_id,business_name,address,city,reason"
    const escape = (value) => {
      if (value == null) return ""
      const str = String(value)
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
      return str
    }
    const lines = failures.map((f) =>
      [f.profile_id, f.business_name, f.address, f.city, f.reason].map(escape).join(","),
    )
    const outputPath = `backfill-provider-coordinates-failures-${Date.now()}.csv`
    writeFileSync(outputPath, `${header}\n${lines.join("\n")}\n`, "utf8")
    console.log(`[backfill-coords] wrote ${failures.length} failures to ${outputPath}`)
  }
}

main().catch((error) => {
  console.error("[backfill-coords] fatal", error)
  process.exit(1)
})
