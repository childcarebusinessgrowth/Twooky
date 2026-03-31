import type { Metadata } from 'next'
import {
  Cormorant_Garamond,
  DM_Sans,
  Inter,
  Lato,
  Nunito,
  Open_Sans,
  Oswald,
  Playfair_Display,
  Source_Sans_3,
} from 'next/font/google'
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

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
})

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
})

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
})

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: 'Twooky | Find the Best Childcare Near You',
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
    <html
      lang="en"
      className={`${dmSans.variable} ${inter.variable} ${cormorantGaramond.variable} ${sourceSans3.variable} ${playfairDisplay.variable} ${lato.variable} ${nunito.variable} ${oswald.variable} ${openSans.variable}`}
      suppressHydrationWarning
    >
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
