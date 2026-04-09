import { Suspense } from "react"
import { UpdatePasswordForm } from "./update-password-form"

export const metadata = {
  title: "Choose a new password | Twooky",
  description: "Set a new password for your Twooky account.",
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md rounded-lg border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground shadow-lg">
          Loading…
        </div>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  )
}
