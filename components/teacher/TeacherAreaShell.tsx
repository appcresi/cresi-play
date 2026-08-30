'use client';

import { useAuth } from '@/context/AuthContext';
import TeacherHeader from '@/components/TeacherHeader';
import { RoleSwitchNotice } from '@/components/RoleSwitchNotice';

// Envuelve app/docente/page.tsx (login + dashboard). Acá vive:
// - La guarda de rol: si alguien con rol de alumno llega acá, ofrecemos
//   cambiar de rol o cerrar sesión en vez de rebotar en silencio (ver
//   RoleSwitchNotice — el rol vive en localStorage del navegador, así que
//   probar la app como alumno y como docente en el mismo navegador podía
//   dejarte "trabado" sin explicación).
// - El header propio de docentes, que solo se muestra una vez logueado
//   (antes de eso, page.tsx ya muestra su propia pantalla pública sin header).
// Es un componente cliente separado del layout (que ahora es servidor, para
// poder exportar metadata) — ver app/docente/layout.tsx.
export default function TeacherAreaShell({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  // `role` ausente (null) puede ser: todavía no cargó, o un usuario sin rol
  // asignado. Solo mostramos el aviso si SABEMOS que no es docente, no ante la duda.
  const isKnownNonTeacher = !!role && role !== 'teacher';

  // A propósito, NO bloqueamos el render mientras `loading` está en curso:
  // page.tsx ya maneja ese estado mostrando su landing pública por defecto
  // (en vez de esta pantalla en blanco), así el contenido queda disponible
  // para quien llega sin sesión — incluidos los buscadores.
  if (isKnownNonTeacher) {
    return <RoleSwitchNotice targetRole="teacher" sectionLabel="el panel docente" />;
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 transition-colors flex flex-col">
      {user && <TeacherHeader />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
