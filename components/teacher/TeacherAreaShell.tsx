'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TeacherHeader from '@/components/TeacherHeader';

// Envuelve app/docente/page.tsx (login + dashboard). Acá vive:
// - La guarda de rol: si alguien con rol de alumno llega acá, lo mandamos a "/".
// - El header propio de docentes, que solo se muestra una vez logueado
//   (antes de eso, page.tsx ya muestra su propia pantalla pública sin header).
// Es un componente cliente separado del layout (que ahora es servidor, para
// poder exportar metadata) — ver app/docente/layout.tsx.
export default function TeacherAreaShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role } = useAuth();
  // `role` ausente (null) puede ser: todavía no cargó, o un usuario sin rol
  // asignado. Solo redirigimos si SABEMOS que no es docente, no ante la duda.
  const isKnownNonTeacher = !!role && role !== 'teacher';

  useEffect(() => {
    if (isKnownNonTeacher) {
      router.replace('/');
    }
  }, [isKnownNonTeacher, router]);

  // A propósito, NO bloqueamos el render mientras `loading` está en curso:
  // page.tsx ya maneja ese estado mostrando su landing pública por defecto
  // (en vez de esta pantalla en blanco), así el contenido queda disponible
  // para quien llega sin sesión — incluidos los buscadores.
  if (isKnownNonTeacher) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {user && <TeacherHeader />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
