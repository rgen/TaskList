import './globals.css'
import Providers from '@/components/Providers'
import AppShell from '@/components/layout/AppShell'

export const metadata = { title: 'TaskList' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
