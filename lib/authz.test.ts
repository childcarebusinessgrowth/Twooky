import { describe, expect, it } from "vitest"
import {
  getAdminPermissionsForRole,
  hasAdminPermission,
  isAdminTeamRole,
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
