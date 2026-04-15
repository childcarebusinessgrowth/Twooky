const DEFAULT_TIMEOUT_MS = 10_000

export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const signal = init.signal ?? AbortSignal.timeout(timeoutMs)
  return fetch(input, {
    ...init,
    signal,
  })
}
