import type { Metadata } from 'next';
import Wordgame from './components/Wordgame';
import React from 'react';

export const metadata: Metadata = {
  title: "ESI | Pasapalabras | CrESI",
  description:
    'Adiviná la palabra oculta escondida detrás de la definición.',
};

export default function Completeword(): JSX.Element {
  return <Wordgame />;
}