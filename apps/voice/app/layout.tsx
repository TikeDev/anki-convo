import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AnkiConvo App',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0d0d0d', color: '#f0f0f0', fontFamily: 'system-ui' }}>
        {children}
      </body>
    </html>
  )
}
