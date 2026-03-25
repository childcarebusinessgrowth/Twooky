import { describe, expect, it, vi, afterEach } from "vitest"
import { publicMessageForError } from "@/lib/publicErrors"

describe("publicMessageForError", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("uses fallback in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(publicMessageForError(new Error("secret details"), "Fallback")).toBe("Fallback")
  })

  it("uses error message outside production", () => {
    vi.stubEnv("NODE_ENV", "test")
    expect(publicMessageForError(new Error("details"), "Fallback")).toBe("details")
  })
})

