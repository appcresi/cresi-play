import type { Metadata } from 'next';
import Impostor from './components/Impostor';
import React from 'react';

export const metadata: Metadata = {
  title: "ESI | Impostor ESI | CrESI",
  description:
    'Descubrí quién es el impostor mientras aprendés sobre sexualidad, cuerpo humano y biología.',
};

export default function ImpostorPage(): JSX.Element {
  return <Impostor />;
}