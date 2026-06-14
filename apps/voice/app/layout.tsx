import type { Metadata } from 'next'
import ThemeToggle from '@/components/ThemeToggle'
import './globals.css'

export const metadata: Metadata = {
  title: 'Review Session - AnkiConvo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
