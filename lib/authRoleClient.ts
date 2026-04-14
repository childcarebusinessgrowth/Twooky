import type { AppRole, AdminTeamRole } from "@/lib/authz"

type AuthRolePayload = {
  role?: AppRole
  redirectPath?: string
  unresolvedRole?: boolean
  error?: string
  adminTeamRole?: AdminTeamRole | null
  adminPermissions?: string[]
}

type FetchAuthRoleResult = {
  response: Response
  payload: AuthRolePayload
}

function isTransientAuthRoleStatus(status: number): boolean {
  return status === 404 || status === 429 || status >= 500
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function fetchAuthRole(options?: { retries?: number; retryDelayMs?: number }): Promise<FetchAuthRoleResult> {
  const retries = options?.retries ?? 2
  const retryDelayMs = options?.retryDelayMs ?? 250

  let lastResult: FetchAuthRoleResult | null = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch("/api/auth/role", { cache: "no-store" })
    const payload = (await response.json().catch(() => ({}))) as AuthRolePayload
    const result = { response, payload }

    lastResult = result

    if (!isTransientAuthRoleStatus(response.status) || attempt === retries) {
      return result
    }

    await sleep(retryDelayMs * (attempt + 1))
  }

  if (!lastResult) {
    throw new Error("Auth role request failed before receiving a response")
  }

  return lastResult
}

export function isTransientAuthRoleResponse(response: Response): boolean {
  return isTransientAuthRoleStatus(response.status)
}
