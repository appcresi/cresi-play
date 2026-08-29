import type { Metadata } from "next";
import SemaforoDelCuidado from "./components/SemaforoDelCuidado";
import React from 'react';

export const metadata: Metadata = {
  title: "ESI | Semáforo del Cuidado | CrESI",
  description:
    "Leé cada situación y elegí el semáforo: está bien, tengo dudas o necesito pedir ayuda. Pensado para reconocer señales, no para generar miedo.",
  alternates: {
    canonical: "https://jugar.cresi.com.ar/semaforo",
  },
};

export default function SemaforoPage(): JSX.Element {
  return <SemaforoDelCuidado />;
}
