import type { Metadata } from 'next'
import { DM_Sans, Inter } from 'next/font/google'
import { AnalyticsConsentGate } from '@/components/analytics-consent-gate'
import { AuthProvider } from '@/components/AuthProvider'
import { CookieConsentBanner } from '@/components/cookie-consent-banner'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
  display: 'swap',
})

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Early Learning Directory | Find the Best Childcare Near You',
  description: 'Search thousands of trusted daycare centers, preschools, and nurseries. Find verified childcare providers with real parent reviews.',
  keywords: 'childcare, daycare, preschool, nursery, childcare near me, daycare centers, early learning',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
          <CookieConsentBanner />
          <AnalyticsConsentGate />
        </AuthProvider>
      </body>
    </html>
  )
}
