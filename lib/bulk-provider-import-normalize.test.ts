import { describe, expect, it } from "vitest"
import { parseBooleanLike, splitCsvList, toRowObjectsFromGrid } from "@/app/admin/listings/import/normalize"

describe("bulk provider import: parseBooleanLike", () => {
  it("parses common true values", () => {
    expect(parseBooleanLike("true")).toBe(true)
    expect(parseBooleanLike("1")).toBe(true)
    expect(parseBooleanLike("YES")).toBe(true)
    expect(parseBooleanLike("on")).toBe(true)
  })

  it("parses common false values", () => {
    expect(parseBooleanLike("false")).toBe(false)
    expect(parseBooleanLike("0")).toBe(false)
    expect(parseBooleanLike("No")).toBe(false)
    expect(parseBooleanLike("off")).toBe(false)
  })

  it("returns null for empty/unknown", () => {
    expect(parseBooleanLike("")).toBe(null)
    expect(parseBooleanLike("maybe")).toBe(null)
  })
})

describe("bulk provider import: splitCsvList", () => {
  it("splits comma-separated list", () => {
    expect(splitCsvList("a, b,,c")).toEqual(["a", "b", "c"])
  })
})

describe("bulk provider import: toRowObjectsFromGrid", () => {
  it("maps rows by supported headers and skips empty rows", () => {
    const grid = [
      ["businessName", "description", "address", "city", "unknown"],
      ["Biz", "Desc", "Addr", "City", "X"],
      ["", "", "", "", ""],
    ]
    const { rows } = toRowObjectsFromGrid(grid)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      businessName: "Biz",
      description: "Desc",
      address: "Addr",
      city: "City",
    })
  })
})

