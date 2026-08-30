'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { RoleSwitchNotice } from '@/components/RoleSwitchNotice';

export default function EscritorioLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, role } = useAuth();

  useEffect(() => {
    if (loading || user) return;
    router.replace('/');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-coral" />
      </div>
    );
  }

  // El rol vive en localStorage del navegador, no en la cuenta de Google:
  // si acá aparece una sesión de docente, ofrecemos cambiar de rol o cerrar
  // sesión en vez de rebotar en silencio a /docente (ver RoleSwitchNotice).
  if (role === 'teacher') {
    return <RoleSwitchNotice targetRole="student" sectionLabel="tu aula de alumno/a" />;
  }

  return <>{children}</>;
}