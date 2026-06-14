import type { Metadata } from 'next'
import ThemeProvider from '@/components/ThemeProvider'
import AuthProvider from '@/components/AuthProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'AnkiConvo — Review Anki Cards with Your Voice',
  description:
    'AnkiConvo is an AI voice agent that lets you review your Anki flashcards through natural conversation — hands-free, anywhere.',
  openGraph: {
    title: 'AnkiConvo',
    description: 'Review Anki flashcards through natural voice conversation.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
