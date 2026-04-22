import { describe, expect, it } from "vitest"
import {
  normalizeProviderTypeSelections,
  resolveProviderTypeSlug,
} from "./provider-type-normalization"

const providerTypes = [
  { slug: "nursery", name: "Nurseries" },
  { slug: "preschool", name: "Preschools" },
  { slug: "afterschool_program", name: "After-school programs" },
]

describe("provider type normalization", () => {
  it("resolves canonical slugs and human-readable labels", () => {
    expect(resolveProviderTypeSlug("nursery", providerTypes)).toBe("nursery")
    expect(resolveProviderTypeSlug("Nurseries", providerTypes)).toBe("nursery")
    expect(resolveProviderTypeSlug("After School Programs", providerTypes)).toBe("afterschool_program")
    expect(resolveProviderTypeSlug("after-school", providerTypes)).toBe("afterschool_program")
  })

  it("normalizes selections to unique canonical slugs", () => {
    expect(
      normalizeProviderTypeSelections(
        ["Nurseries", "preschool", "after-school", "After School Programs"],
        providerTypes,
      ),
    ).toEqual(["nursery", "preschool", "afterschool_program"])
  })

  it("drops values that cannot be resolved", () => {
    expect(normalizeProviderTypeSelections(["Art & Creative Classes"], providerTypes)).toEqual([])
  })
})
