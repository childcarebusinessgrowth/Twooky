type PerfMeta = Record<string, string | number | boolean | null | undefined>

const PERF_LOG_ENABLED = process.env.APP_PERF_LOGS === "1"

function elapsedMsSince(start: bigint): number {
  const elapsedNs = process.hrtime.bigint() - start
  return Number(elapsedNs) / 1_000_000
}

export function startPerfTimer(operation: string, meta: PerfMeta = {}) {
  const start = process.hrtime.bigint()
  const log = (phase: string, extra: PerfMeta = {}) => {
    if (!PERF_LOG_ENABLED) return
    const payload = {
      operation,
      phase,
      duration_ms: Number(elapsedMsSince(start).toFixed(1)),
      ...meta,
      ...extra,
    }
    console.info("[perf]", payload)
  }

  return {
    mark: (phase: string, extra: PerfMeta = {}) => log(phase, extra),
    end: (extra: PerfMeta = {}) => log("done", extra),
  }
}

