'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';


// Envuelve TODO lo que está bajo app/(routes)/ — la home ("/") y cada
// página de juego (trivias, biopuzzle, condon, etc.). Antes cada página
// no tenía ninguna protección; ahora la tienen todas de una sola vez acá.
export default function StudentAreaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuth();

  // Excepción: un docente SÍ puede entrar a jugar/previsualizar sus
  // propias trivias (botón "Jugar" en /docente/trivias). El resto de los
  // juegos sigue bloqueado para docentes — no tiene sentido que un
  // docente termine perdido en BioPuzzle o Condón.
  const isPlayingTrivia = pathname?.startsWith('/trivias/');
  const isTeacher = role === 'teacher' && !isPlayingTrivia;

  useEffect(() => {
    if (isTeacher) {
      router.replace('/docente');
    }
  }, [isTeacher, router]);

  if (isTeacher) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-coral" />
      </div>
    );
  }

  return <>
  <Header />
  {children}
  </>;
}