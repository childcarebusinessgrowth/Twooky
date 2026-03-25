import { describe, expect, it } from "vitest"
import { shouldBlockWhenSupabaseEnvMissing } from "@/proxy"

describe("proxy env guard", () => {
  it("blocks auth pages and protected prefixes when Supabase env is missing", () => {
    expect(shouldBlockWhenSupabaseEnvMissing("/login")).toBe(true)
    expect(shouldBlockWhenSupabaseEnvMissing("/signup")).toBe(true)
    expect(shouldBlockWhenSupabaseEnvMissing("/admin")).toBe(true)
    expect(shouldBlockWhenSupabaseEnvMissing("/admin/listings")).toBe(true)
    expect(shouldBlockWhenSupabaseEnvMissing("/dashboard")).toBe(true)
    expect(shouldBlockWhenSupabaseEnvMissing("/dashboard/provider")).toBe(true)
  })

  it("does not block public routes when Supabase env is missing", () => {
    expect(shouldBlockWhenSupabaseEnvMissing("/")).toBe(false)
    expect(shouldBlockWhenSupabaseEnvMissing("/providers")).toBe(false)
    expect(shouldBlockWhenSupabaseEnvMissing("/providers/some-slug")).toBe(false)
  })
})

