import type { Metadata } from 'next'
import { DM_Sans, Inter } from 'next/font/google'
import { AnalyticsConsentGate } from '@/components/analytics-consent-gate'
import { CookieConsentBannerLazy } from '@/components/cookie-consent-banner-lazy'
import { DeferredClientRender } from "@/components/deferred-client-render"
import { AppShell } from '@/components/layout/app-shell'
import { Footer } from '@/components/layout/footer'
import { getRandomFooterCities } from '@/lib/locations'
import { WebVitalsClient } from '@/components/web-vitals-client'
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
  title: 'Twooky | Find the Best Childcare Near You',
  description: 'Search thousands of trusted daycare centers, preschools, and nurseries. Find verified childcare providers with real parent reviews.',
  keywords: 'childcare, daycare, preschool, nursery, childcare near me, daycare centers, early learning',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    apple: '/favicon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const footerCities = await getRandomFooterCities(7)

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <WebVitalsClient />
        <AppShell footer={<Footer cities={footerCities} />}>
          {children}
        </AppShell>
        <Toaster />
        <DeferredClientRender timeoutMs={1200}>
          <CookieConsentBannerLazy />
        </DeferredClientRender>
        <DeferredClientRender timeoutMs={1800}>
          <AnalyticsConsentGate />
        </DeferredClientRender>
      </body>
    </html>
  )
}
