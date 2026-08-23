'use client';

import Header from '@/components/Header';

// Envuelve TODO lo que está bajo app/(routes)/ — la home ("/") y cada
// página de juego (trivias, biopuzzle, condon, etc.) — para que compartan
// el mismo header.
//
// Antes esto también bloqueaba a los docentes y los mandaba de vuelta a
// /docente (con una única excepción para previsualizar sus propias
// trivias): "no tenía sentido que terminaran perdidos en BioPuzzle o
// Condón". Ese bloqueo entraba en conflicto directo con /docente/formacion
// ("Mi formación"), que manda a los docentes acá a propósito para que
// jueguen y prueben el contenido antes de asignarlo — con ese bloqueo
// activo, cualquier clic en esa pestaña los devolvía al panel sin llegar
// a jugar nunca. Se sacó: ahora un docente puede entrar a cualquier juego
// igual que un alumno.
export default function StudentAreaLayout({ children }: { children: React.ReactNode }) {
  return <>
  <Header />
  {children}
  </>;
}