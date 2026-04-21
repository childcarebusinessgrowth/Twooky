import type { Metadata } from 'next'
import { DM_Sans, Fraunces, Inter, Nunito } from 'next/font/google'
import Script from 'next/script'
import { headers } from "next/headers"
import { AuthRecoveryRedirect } from "@/components/auth-recovery-redirect"
import { AnalyticsConsentGate } from '@/components/analytics-consent-gate'
import { CookieConsentBannerLazy } from '@/components/cookie-consent-banner-lazy'
import { DeferredClientRender } from "@/components/deferred-client-render"
import { AppShell } from '@/components/layout/app-shell'
import { Footer } from '@/components/layout/footer'
import { getRandomFooterCitiesForMarket } from '@/lib/locations'
import { getMarketOptions } from "@/lib/market-options"
import { getMarketFromCookies } from '@/lib/market-server'
import { WebVitalsClient } from '@/components/web-vitals-client'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
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

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
})

export const metadata: Metadata = {
  title: 'Twooky | Find the Best Providers Near You',
  description: 'Search thousands of trusted daycare centers, preschools, and nurseries. Find verified providers with real parent reviews.',
  keywords: 'provider, daycare, preschool, nursery, providers near me, daycare centers, early learning',
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
  const requestHeaders = await headers()
  const isMicrositeRequest = requestHeaders.get("x-microsite-request") === "1"
  const market = await getMarketFromCookies()
  const marketOptions = await getMarketOptions()
  const footerCities = await getRandomFooterCitiesForMarket(7, market)
  const enableVercelObservability = process.env.VERCEL === "1"

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${inter.variable} ${fraunces.variable} ${nunito.variable}`}
      suppressHydrationWarning
    >
      <Script
        id="microsoft-clarity"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wf7dxi61g7");
          `,
        }}
      />
      <body className="font-sans antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <AuthRecoveryRedirect />
        <WebVitalsClient />
        {isMicrositeRequest ? (
          children
        ) : (
          <AppShell
            footer={<Footer cities={footerCities} market={market} />}
            initialMarket={market}
            marketOptions={marketOptions}
          >
            {children}
          </AppShell>
        )}
        <Toaster />
        <SonnerToaster />
        <DeferredClientRender timeoutMs={1200}>
          <CookieConsentBannerLazy />
        </DeferredClientRender>
        <DeferredClientRender timeoutMs={1800}>
          <AnalyticsConsentGate enabled={enableVercelObservability} />
        </DeferredClientRender>
      </body>
    </html>
  )
}
