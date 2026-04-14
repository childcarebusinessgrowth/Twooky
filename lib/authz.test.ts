import { describe, expect, it } from "vitest"
import {
  getAdminPermissionsForRole,
  hasAdminPermission,
  isAdminTeamRole,
  resolveRoleForUser,
} from "./authz"

describe("admin team roles", () => {
  it("validates admin team role values", () => {
    expect(isAdminTeamRole("base_user")).toBe(true)
    expect(isAdminTeamRole("account_manager")).toBe(true)
    expect(isAdminTeamRole("top_admin")).toBe(true)
    expect(isAdminTeamRole("parent")).toBe(false)
    expect(isAdminTeamRole("")).toBe(false)
  })

  it("grants base user review and badge permissions only", () => {
    const permissions = getAdminPermissionsForRole("base_user")
    expect(permissions.has("reviews.approve")).toBe(true)
    expect(permissions.has("badges.verify")).toBe(true)
    expect(permissions.has("listings.manage")).toBe(false)
    expect(permissions.has("team.manage")).toBe(false)
  })

  it("grants account manager selected admin management permissions", () => {
    const permissions = getAdminPermissionsForRole("account_manager")
    expect(permissions.has("listings.manage")).toBe(true)
    expect(permissions.has("sponsors.manage")).toBe(true)
    expect(permissions.has("parents.manage")).toBe(true)
    expect(permissions.has("blogs.manage")).toBe(true)
    expect(permissions.has("directory.manage")).toBe(true)
    expect(permissions.has("team.manage")).toBe(false)
  })

  it("grants top admin team management permissions", () => {
    expect(hasAdminPermission("top_admin", "team.manage")).toBe(true)
    expect(hasAdminPermission("top_admin", "reviews.approve")).toBe(true)
  })
})

function makeSupabaseRoleLookup(result: { data: { role?: unknown } | null; error: { message: string } | null }) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => result,
              }
            },
          }
        },
      }
    },
  }
}

describe("resolveRoleForUser", () => {
  it("does not trust metadata when the profile row is missing", async () => {
    const resolution = await resolveRoleForUser(makeSupabaseRoleLookup({ data: null, error: null }) as never, {
      id: "user-1",
      app_metadata: { role: "provider" },
      user_metadata: {},
    } as never)

    expect(resolution).toEqual({
      role: null,
      source: null,
      reason: "profile_role_missing_or_invalid",
    })
  })

  it("falls back to metadata when the profile query errors", async () => {
    const resolution = await resolveRoleForUser(
      makeSupabaseRoleLookup({
        data: null,
        error: { message: "temporary query failure" },
      }) as never,
      {
        id: "user-2",
        app_metadata: { role: "parent" },
        user_metadata: {},
      } as never,
    )

    expect(resolution).toEqual({
      role: "parent",
      source: "metadata",
      reason: "profile_query_error",
      profileErrorMessage: "temporary query failure",
    })
  })
})
