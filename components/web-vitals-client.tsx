"use client"

import { useReportWebVitals } from "next/web-vitals"

/**
 * Logs Core Web Vitals in development. Hook up `sendToAnalytics` in production if needed.
 */
export function WebVitalsClient() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[web-vitals] ${metric.name}`, metric.value)
    }
  })
  return null
}
