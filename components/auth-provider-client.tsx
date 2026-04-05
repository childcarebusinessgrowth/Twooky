"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/components/AuthProvider"

type AuthProviderClientProps = {
  children: ReactNode
}

export function AuthProviderClient({ children }: AuthProviderClientProps) {
  return <AuthProvider>{children}</AuthProvider>
}
