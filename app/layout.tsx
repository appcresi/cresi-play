import { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const monaSans = localFont({
  src: './fonts/Mona-Sans.woff2',
  display: 'swap',
  variable: '--font-mona-sans'
})

export const metadata: Metadata = {
  icons: ['/cresi-logo.ico']
}

export default function RootLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang='es' className={monaSans.className}>
      <body>{children}</body>
    </html>
  )
}
