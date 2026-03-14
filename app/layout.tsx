import type { Metadata } from 'next'
import { DM_Sans, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/AuthProvider'
import { AppShell } from '@/components/layout/app-shell'
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
    <html lang="en" className={`${dmSans.variable} ${inter.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
