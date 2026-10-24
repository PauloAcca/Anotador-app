import type { Metadata, Viewport } from 'next'
import { Outfit, Fraunces } from 'next/font/google'
import { AuroraBackdrop } from '@/components/layout/aurora-backdrop'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#0A0E14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: 'Aura · Espacio',
    template: '%s · Aura Espacio',
  },
  description:
    'Tu espacio personal con calma: hábitos, materias, lecturas, exámenes, notas y listas de progreso.',
  keywords: [
    'hábitos',
    'materias',
    'universidad',
    'lecturas',
    'notas',
    'progreso',
    'aura espacio',
  ],
  applicationName: 'Aura Espacio',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aura Espacio',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${outfit.variable} ${fraunces.variable}`}
      style={{ backgroundColor: '#0A0E14' }}
    >
      <body className="min-h-dvh antialiased">
        <AuroraBackdrop />
        {children}
      </body>
    </html>
  )
}
