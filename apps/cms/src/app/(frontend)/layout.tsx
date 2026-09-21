import React from 'react'

export const metadata = {
  title: 'PULSE CMS',
  description: 'Content management for pulse.derweili.de.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
