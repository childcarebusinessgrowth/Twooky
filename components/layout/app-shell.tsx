'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'

const DASHBOARD_PREFIXES = ['/dashboard', '/admin', '/parents', '/site']

interface AppShellProps {
  children: ReactNode
  footer: ReactNode
}

export function AppShell({ children, footer }: AppShellProps) {
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
      {footer}
    </>
  )
}

