import type { Metadata } from 'next';
import Generatememe from './components/generatememe';
import React from 'react';

export const metadata: Metadata = {
  title: "ESI | Meme Creator | CrESI",
  description:
    'Creá todos los memes divertidos que quieras para concientizar.',
};

export default function MemeGeneratorPage(): JSX.Element {
  return <Generatememe />;
}