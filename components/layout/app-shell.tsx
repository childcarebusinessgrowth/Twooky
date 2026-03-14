'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

const DASHBOARD_PREFIXES = ['/dashboard', '/admin', '/parents']

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  const shouldHideChrome = DASHBOARD_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  if (shouldHideChrome) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  )
}

