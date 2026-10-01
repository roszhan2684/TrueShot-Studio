import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { QueryProvider } from '@/components/shared/query-provider'
import { Toaster } from '@/components/shared/toaster'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s — ${APP_NAME}` },
  description: APP_TAGLINE,
  keywords: ['AI headshots', 'professional headshots', 'LinkedIn photo', 'portrait AI'],
  authors: [{ name: 'TrueShot Studio' }],
  creator: 'TrueShot Studio',
  openGraph: { type: 'website', locale: 'en_US', title: APP_NAME, description: APP_TAGLINE, siteName: APP_NAME },
  twitter: { card: 'summary_large_image', title: APP_NAME, description: APP_TAGLINE },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
