import type { Metadata } from 'next';
import Impostor from './components/Impostor';
import React from 'react';

export const metadata: Metadata = {
  title: "ESI | Impostor ESI | CrESI",
  description:
    'Descubrí quién es el impostor mientras aprendés sobre sexualidad, cuerpo humano y biología.',
  alternates: {
    canonical: "https://jugar.cresi.com.ar/impostor",
  },
};

export default function ImpostorPage(): JSX.Element {
  return <Impostor />;
}