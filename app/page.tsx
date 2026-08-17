"use client"
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WelcomeLanding from './components/WelcomeLanding';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, role } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    router.replace(role === 'teacher' ? '/docente' : '/escritorio');
  }, [loading, user, role, router]);

  // A propósito, NO bloqueamos el primer render con un spinner mientras
  // `loading` está en curso: `loading` arranca en `true` tanto en el
  // servidor como en el cliente (el estado de Firebase Auth no se puede
  // saber en SSR), así que un spinner-first acá significaba que el HTML
  // inicial de "/" — la página con más visitas del sitio — nunca tenía
  // contenido real. Mostramos la landing directamente; a quien ya tiene
  // sesión lo redirigimos apenas se confirma, sin retener el primer pintado.
  return <WelcomeLanding />;
}