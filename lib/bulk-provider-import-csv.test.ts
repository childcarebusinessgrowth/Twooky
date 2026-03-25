import { describe, expect, it } from "vitest"
import { parseCsvToRows } from "@/app/admin/listings/import/csv"

describe("bulk provider import: parseCsvToRows", () => {
  it("parses basic comma-separated values", () => {
    const rows = parseCsvToRows("a,b\nc,d\n")
    expect(rows).toEqual([
      ["a", "b"],
      ["c", "d"],
    ])
  })

  it("handles quoted cells with commas and escaped quotes", () => {
    const rows = parseCsvToRows('name,desc\n"ACME, Inc.","He said ""hi"""')
    expect(rows[1]).toEqual(["ACME, Inc.", 'He said "hi"'])
  })

  it("handles newlines inside quoted cells", () => {
    const rows = parseCsvToRows('a,b\n"line1\nline2",x\n')
    expect(rows[1]).toEqual(["line1\nline2", "x"])
  })
})

