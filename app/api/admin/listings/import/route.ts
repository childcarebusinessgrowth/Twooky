import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { assertServerRole } from "@/lib/authzServer"
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin"
import { createAdminProvider } from "@/app/admin/listings/new/actions"
import { parseCsvToRows } from "@/app/admin/listings/import/csv"
import { parseBooleanLike, splitCsvList, toRowObjectsFromGrid } from "@/app/admin/listings/import/normalize"

export const runtime = "nodejs"

const MAX_ROWS = 500

type ImportRowResult =
  | { rowNumber: number; status: "created"; profileId: string; slug: string }
  | { rowNumber: number; status: "skipped"; reason: string }
  | { rowNumber: number; status: "failed"; error: string }

function asText(value: unknown): string {
  return String(value ?? "").trim()
}

async function resolveCurrencyId(input: { currencyId?: string; currencyCode?: string }): Promise<string> {
  const currencyId = asText(input.currencyId)
  if (currencyId) return currencyId
  const currencyCode = asText(input.currencyCode).toUpperCase()
  if (!currencyCode) return ""
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("currencies")
    .select("id")
    .eq("code", currencyCode)
    .eq("is_active", true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.id ?? ""
}

async function resolveCountryId(input: { countryId?: string; country?: string }): Promise<string> {
  const countryId = asText(input.countryId)
  if (countryId) return countryId
  const countryName = asText(input.country)
  if (!countryName) return ""
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("countries")
    .select("id")
    .ilike("name", countryName)
    .eq("is_active", true)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.id ?? ""
}

async function resolveCityId(input: {
  cityId?: string
  cityCatalog?: string
  countryId?: string
}): Promise<string> {
  const cityId = asText(input.cityId)
  if (cityId) return cityId
  const cityName = asText(input.cityCatalog)
  if (!cityName) return ""

  const supabase = getSupabaseAdminClient()
  const q = supabase.from("cities").select("id, country_id").ilike("name", cityName).eq("is_active", true)
  const countryId = asText(input.countryId)
  const { data, error } = countryId ? await q.eq("country_id", countryId).maybeSingle() : await q.maybeSingle()
  if (error) throw new Error(error.message)
  return data?.id ?? ""
}

async function resolveCurriculumIdsByName(names: string[]): Promise<string[]> {
  if (names.length === 0) return []
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("curriculum_philosophies")
    .select("id, name")
    .eq("is_active", true)
  if (error) throw new Error(error.message)

  const byLowerName = new Map((data ?? []).map((row) => [row.name.trim().toLowerCase(), row.id]))
  const ids: string[] = []
  for (const name of names) {
    const id = byLowerName.get(name.trim().toLowerCase())
    if (id) ids.push(id)
  }
  return ids
}

async function isDuplicateProvider(businessName: string, cityText: string, cityId?: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient()
  const base = supabase.from("provider_profiles").select("profile_id").ilike("business_name", businessName)
  const { data, error } = cityId
    ? await base.eq("city_id", cityId).limit(1)
    : await base.ilike("city", cityText).limit(1)
  if (error) throw new Error(error.message)
  return (data ?? []).length > 0
}

export async function POST(request: Request) {
  try {
    await assertServerRole("admin")

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 })
    }

    const filename = (file.name || "").toLowerCase()
    const isCsv = filename.endsWith(".csv") || file.type === "text/csv"
    const isXlsx =
      filename.endsWith(".xlsx") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    if (!isCsv && !isXlsx) {
      return NextResponse.json({ error: "Unsupported file type. Upload a .csv or .xlsx file." }, { status: 400 })
    }

    let grid: unknown[][]
    if (isCsv) {
      const text = await file.text()
      grid = parseCsvToRows(text)
    } else {
      const buf = Buffer.from(await file.arrayBuffer())
      const wb = XLSX.read(buf, { type: "buffer" })
      const sheetName = wb.SheetNames.includes("Listings") ? "Listings" : wb.SheetNames[0]
      const sheet = wb.Sheets[sheetName]
      grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][]
    }

    const { rows } = toRowObjectsFromGrid(grid)
    if (rows.length === 0) {
      return NextResponse.json({ error: "No rows found in file." }, { status: 400 })
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Too many rows. Max ${MAX_ROWS} rows per import.` }, { status: 400 })
    }

    const results: ImportRowResult[] = []

    for (let i = 0; i < rows.length; i += 1) {
      const rowNumber = i + 2 // header is row 1
      const row = rows[i]
      try {
        const businessName = asText(row.businessName)
        const description = asText(row.description)
        const address = asText(row.address)
        const city = asText(row.city)

        if (!businessName || !description || !address || !city) {
          results.push({
            rowNumber,
            status: "failed",
            error: "Missing required fields (businessName, description, address, city).",
          })
          continue
        }

        const countryIdResolved = await resolveCountryId({ countryId: row.countryId, country: row.country })
        const currencyIdResolved = await resolveCurrencyId({ currencyId: row.currencyId, currencyCode: row.currencyCode })
        const cityIdResolved = await resolveCityId({
          cityId: row.cityId,
          cityCatalog: row.cityCatalog,
          countryId: countryIdResolved || row.countryId,
        })

        const duplicate = await isDuplicateProvider(businessName, city, cityIdResolved || undefined)
        if (duplicate) {
          results.push({
            rowNumber,
            status: "skipped",
            reason: "Duplicate provider (business name + city).",
          })
          continue
        }

        const fd = new FormData()
        fd.set("skipVerifiedBadgeOnCreate", "true")
        fd.set("businessName", businessName)
        fd.set("description", description)
        fd.set("phone", asText(row.phone))
        fd.set("website", asText(row.website))
        fd.set("address", address)
        fd.set("city", city)
        fd.set("listingStatus", asText(row.listingStatus))
        fd.set("openingTime", asText(row.openingTime))
        fd.set("closingTime", asText(row.closingTime))
        fd.set("dailyFeeFrom", asText(row.dailyFeeFrom))
        fd.set("dailyFeeTo", asText(row.dailyFeeTo))
        fd.set("registrationFee", asText(row.registrationFee))
        fd.set("depositFee", asText(row.depositFee))
        fd.set("mealsFee", asText(row.mealsFee))
        fd.set("totalCapacity", asText(row.totalCapacity))
        fd.set("languagesSpoken", asText(row.languagesSpoken))
        fd.set("faqsJson", asText(row.faqsJson))

        if (countryIdResolved) fd.set("countryId", countryIdResolved)
        if (cityIdResolved) fd.set("cityId", cityIdResolved)
        if (currencyIdResolved) fd.set("currencyId", currencyIdResolved)

        const featuredBool = parseBooleanLike(asText(row.featured))
        if (featuredBool != null) fd.set("featured", featuredBool ? "true" : "false")

        for (const key of [
          "serviceTransport",
          "serviceExtendedHours",
          "servicePickupDropoff",
          "serviceExtracurriculars",
        ] as const) {
          const b = parseBooleanLike(asText(row[key]))
          if (b != null) fd.set(key, b ? "true" : "false")
        }

        for (const providerType of splitCsvList(asText(row.providerTypes))) fd.append("providerTypes", providerType)
        for (const ageGroup of splitCsvList(asText(row.ageGroupsServed))) fd.append("ageGroupsServed", ageGroup)
        for (const amenity of splitCsvList(asText(row.amenities))) fd.append("amenities", amenity)

        const virtualTours = splitCsvList(asText(row.virtualTourUrls))
        for (const url of virtualTours) fd.append("virtualTourUrls", url)

        const curriculumNames = splitCsvList(asText(row.curriculumTypes))
        if (curriculumNames.length > 0) {
          const curriculumIds = await resolveCurriculumIdsByName(curriculumNames)
          for (const id of curriculumIds) fd.append("curriculumTypes", id)
        }

        const created = await createAdminProvider(fd)
        if (!created.ok) {
          results.push({ rowNumber, status: "failed", error: created.error })
          continue
        }
        results.push({
          rowNumber,
          status: "created",
          profileId: created.profileId,
          slug: created.slug,
        })
      } catch (e) {
        results.push({
          rowNumber,
          status: "failed",
          error: e instanceof Error ? e.message : "Unknown error.",
        })
      }
    }

    const summary = results.reduce(
      (acc, r) => {
        acc.total += 1
        if (r.status === "created") acc.created += 1
        if (r.status === "skipped") acc.skipped += 1
        if (r.status === "failed") acc.failed += 1
        return acc
      },
      { total: 0, created: 0, skipped: 0, failed: 0 }
    )

    return NextResponse.json({ ok: true, summary, results })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong."
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

