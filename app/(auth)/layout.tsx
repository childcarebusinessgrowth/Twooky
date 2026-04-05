import { AuthProviderClient } from "@/components/auth-provider-client"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProviderClient>
      <div className="min-h-screen flex flex-col bg-muted/30">
        <main className="flex-1 flex items-center justify-center px-4 pb-12">
          {children}
        </main>
      </div>
    </AuthProviderClient>
  )
}
