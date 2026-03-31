import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ForgotPasswordForm } from "./forgot-password-form"

export const metadata = {
  title: "Reset Password | Twooky",
  description: "Reset your Twooky account password.",
}

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md shadow-lg border-border/50">
      <CardHeader>
        <Link href="/login" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span className="hover:underline">Back to login</span>
        </Link>
        <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
        <CardDescription>
          Enter the email associated with your account and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ForgotPasswordForm />
        <p className="text-xs text-muted-foreground text-center">
          If you no longer have access to this email, please contact support through our{" "}
          <Link href="/contact" className="text-primary hover:underline">
            contact page
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  )
}

