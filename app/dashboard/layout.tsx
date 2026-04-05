import type { ReactNode } from "react"
import { AuthProviderClient } from "@/components/auth-provider-client"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AuthProviderClient>{children}</AuthProviderClient>
}
