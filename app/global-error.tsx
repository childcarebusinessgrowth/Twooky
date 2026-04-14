"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error("Global app error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">The app hit a fatal error</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Refresh the page to retry. If this keeps happening, return to the homepage and try again.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Refresh</Button>
            <Button variant="outline" onClick={() => window.location.assign("/")}>
              Go Home
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
