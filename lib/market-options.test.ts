import { describe, expect, it } from "vitest"
import { mapCountryRowsToMarketOptions, type CountryRow } from "./market-option-mapping"

describe("mapCountryRowsToMarketOptions", () => {
  it("maps DB-native codes (uk/usa/uae) to supported market IDs", () => {
    const rows: CountryRow[] = [
      { code: "uk", name: "United Kingdom", sort_order: 1 },
      { code: "usa", name: "United States", sort_order: 2 },
      { code: "uae", name: "United Arab Emirates", sort_order: 3 },
    ]

    const mapped = mapCountryRowsToMarketOptions(rows)
    expect(mapped).toEqual([
      { id: "uk", label: "United Kingdom" },
      { id: "us", label: "United States" },
      { id: "uae", label: "United Arab Emirates" },
    ])
  })

  it("maps ISO aliases and deduplicates by market id", () => {
    const rows: CountryRow[] = [
      { code: "GB", name: "United Kingdom", sort_order: 1 },
      { code: "UK", name: "UK duplicate", sort_order: 2 },
      { code: "US", name: "United States", sort_order: 3 },
      { code: "AE", name: "UAE", sort_order: 4 },
    ]

    const mapped = mapCountryRowsToMarketOptions(rows)
    expect(mapped).toEqual([
      { id: "uk", label: "United Kingdom" },
      { id: "us", label: "United States" },
      { id: "uae", label: "UAE" },
    ])
  })

  it("ignores unsupported countries", () => {
    const rows: CountryRow[] = [
      { code: "RO", name: "Romania", sort_order: 1 },
      { code: "DE", name: "Germany", sort_order: 2 },
    ]
    expect(mapCountryRowsToMarketOptions(rows)).toEqual([])
  })
})
