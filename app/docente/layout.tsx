'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TeacherHeader from '@/components/TeacherHeader';

// Envuelve app/docente/page.tsx (login + dashboard). Acá vive:
// - La guarda de rol: si alguien con rol de alumno llega acá, lo mandamos a "/".
// - El header propio de docentes, que solo se muestra una vez logueado
//   (antes de eso, page.tsx ya muestra su propia pantalla de login sin header).
export default function TeacherAreaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, role } = useAuth();
  // `role` ausente (null) puede ser: todavía no cargó, o un usuario sin rol
  // asignado. Solo redirigimos si SABEMOS que no es docente, no ante la duda.
  const isKnownNonTeacher = !!role && role !== 'teacher';

  useEffect(() => {
    if (isKnownNonTeacher) {
      router.replace('/');
    }
  }, [isKnownNonTeacher, router]);

  if (loading || isKnownNonTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {user && <TeacherHeader />}
      <div className="flex-1">{children}</div>
    </div>
  );
}