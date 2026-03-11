import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/providers/ToastProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Forge - Financial Infrastructure, Forged in Code',
  description: 'Programmatic payouts, real-time transactions, and multi-currency wallets. One API to power your entire money layer.',
  keywords: ['fintech', 'API', 'payouts', 'financial infrastructure', 'payments'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
