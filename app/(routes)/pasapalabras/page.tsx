// app/page.tsx
import type { Metadata } from 'next';
import Wordgame from './components/Wordgame';

export const metadata: Metadata = {
  title: 'Pasapalabra | CrESI',
  description:
    'Adiviná la palabra oculta escondida detrás de la definición.',
};

export default function Home() {
  return (
    <>
      <Wordgame />
    </>
  );
}
