import { type Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

import Analytics from '@/components/Analytics'
import Adsense from '@/components/Adsense'
import CharacterSelectionModal from '@/components/CharacterSelectionModal';

const monaSans = localFont({
  src: './fonts/Mona-Sans.woff2',
  display: 'swap',
  variable: '--font-mona-sans'
})
import ComicBurgerMenu from '@/components/ComicBurgerMenu';

export const metadata: Metadata = {
  icons: ['/cresi-logo.ico']
}

export default function RootLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang='es' className={monaSans.className}>
      <body className='bg-[#FFE5E5]'>{children}</body>
      <CharacterSelectionModal />
      <ComicBurgerMenu />
      <Analytics />
      <Adsense />
    </html>
  )
}
