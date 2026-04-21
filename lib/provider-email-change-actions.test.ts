import { beforeEach, describe, expect, it, vi } from "vitest"

const createSupabaseServerClientMock = vi.fn()
const getSupabaseAdminClientMock = vi.fn()
const sendProviderEmailChangeConfirmationEmailMock = vi.fn()
const deleteProviderPhotoStorageMock = vi.fn()
const resolveOwnedProviderProfileIdMock = vi.fn()

vi.mock("@/lib/supabaseServer", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}))

vi.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdminClient: getSupabaseAdminClientMock,
}))

vi.mock("@/lib/email/providerEmailChange", () => ({
  sendProviderEmailChangeConfirmationEmail: sendProviderEmailChangeConfirmationEmailMock,
}))

vi.mock("@/lib/provider-photo-storage", () => ({
  deleteProviderPhotoStorage: deleteProviderPhotoStorageMock,
}))

vi.mock("@/lib/provider-ownership", () => ({
  resolveOwnedProviderProfileId: resolveOwnedProviderProfileIdMock,
}))

function createProfilesQueryChain(rows: Array<Record<string, unknown> | null>) {
  let index = 0
  const chain: any = {
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({
      data: rows[index++] ?? null,
      error: null,
    })),
  }
  return chain
}

function createInsertOnlyChain() {
  const chain: any = {
    delete: vi.fn(() => chain),
    insert: vi.fn(async () => ({ data: null, error: null })),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    select: vi.fn(() => chain),
    update: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
  }
  return chain
}

function createPendingClaimChain(row: Record<string, unknown> | null) {
  const chain: any = {
    delete: vi.fn(() => chain),
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    update: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data: row, error: null })),
  }
  return chain
}

describe("provider email change actions", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
    sendProviderEmailChangeConfirmationEmailMock.mockResolvedValue(true)
  })

  it("creates a pending confirmation request and emails the current inbox", async () => {
    const serverUser = { id: "provider-1", email: "current@example.com" }
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: serverUser }, error: null })),
      },
    })

    const profilesChain = createProfilesQueryChain([{ id: "provider-1", role: "provider" }, null])
    const pendingChain = createInsertOnlyChain()
    getSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") return profilesChain
        if (table === "pending_email_changes") return pendingChain
        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    const { requestProviderEmailChange } = await import("../app/dashboard/provider/settings/actions")
    const result = await requestProviderEmailChange({ newEmail: "new@example.com" })

    expect(result).toEqual({})
    expect(sendProviderEmailChangeConfirmationEmailMock).toHaveBeenCalledTimes(1)
    expect(sendProviderEmailChangeConfirmationEmailMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: "current@example.com",
        currentEmail: "current@example.com",
        requestedEmail: "new@example.com",
      }),
    )
    expect(sendProviderEmailChangeConfirmationEmailMock.mock.calls[0][0].confirmationLink).toContain(
      "/confirm-email-change?token=",
    )
    expect(pendingChain.insert).toHaveBeenCalledTimes(1)
  })

  it("rejects a requested email already used by another account", async () => {
    const serverUser = { id: "provider-1", email: "current@example.com" }
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: serverUser }, error: null })),
      },
    })

    const profilesChain = createProfilesQueryChain([
      { id: "provider-1", role: "provider" },
      { id: "other-user", role: "parent" },
    ])
    const pendingChain = createInsertOnlyChain()
    getSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") return profilesChain
        if (table === "pending_email_changes") return pendingChain
        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    const { requestProviderEmailChange } = await import("../app/dashboard/provider/settings/actions")
    const result = await requestProviderEmailChange({ newEmail: "used@example.com" })

    expect(result).toEqual({ error: "This email is already in use." })
    expect(sendProviderEmailChangeConfirmationEmailMock).not.toHaveBeenCalled()
    expect(pendingChain.insert).not.toHaveBeenCalled()
  })

  it("confirms an email change and updates auth plus profile email", async () => {
    const pendingRow = {
      id: "pending-1",
      profile_id: "provider-1",
      current_email: "current@example.com",
      requested_email: "new@example.com",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      used_at: null,
    }
    const pendingChain = createPendingClaimChain(pendingRow)
    const profileChain = createProfilesQueryChain([{ id: "provider-1", role: "provider", email: "current@example.com" }])
    const authUpdateUserById = vi.fn(async () => ({ data: { user: { id: "provider-1" } }, error: null }))

    getSupabaseAdminClientMock.mockReturnValue({
      auth: {
        admin: {
          updateUserById: authUpdateUserById,
        },
      },
      from: vi.fn((table: string) => {
        if (table === "pending_email_changes") return pendingChain
        if (table === "profiles") return profileChain
        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    const { confirmProviderEmailChange } = await import("../app/dashboard/provider/settings/actions")
    const result = await confirmProviderEmailChange("token-value")

    expect(result).toEqual({ ok: true })
    expect(authUpdateUserById).toHaveBeenCalledWith("provider-1", {
      email: "new@example.com",
      email_confirm: true,
    })
    expect(profileChain.update).toHaveBeenCalledTimes(1)
    expect(pendingChain.update).toHaveBeenCalledTimes(1)
  })

  it("rejects expired confirmation links", async () => {
    const pendingRow = {
      id: "pending-1",
      profile_id: "provider-1",
      current_email: "current@example.com",
      requested_email: "new@example.com",
      expires_at: new Date(Date.now() - 60_000).toISOString(),
      used_at: null,
    }
    const pendingChain = createPendingClaimChain(pendingRow)
    const profileChain = createProfilesQueryChain([{ id: "provider-1", role: "provider", email: "current@example.com" }])

    getSupabaseAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "pending_email_changes") return pendingChain
        if (table === "profiles") return profileChain
        throw new Error(`Unexpected table: ${table}`)
      }),
    })

    const { confirmProviderEmailChange } = await import("../app/dashboard/provider/settings/actions")
    const result = await confirmProviderEmailChange("token-value")

    expect(result.ok).toBe(false)
    expect((result as { status?: string }).status).toBe("expired")
    expect(pendingChain.delete).toHaveBeenCalledTimes(1)
  })
})
