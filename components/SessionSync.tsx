'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { syncSessionCookie } from '@/lib/sessionClient';

// Se monta en las páginas de servidor que se renderizaron SIN sesión. Cubre
// el caso de un usuario que sí está logueado en el navegador pero todavía
// no tiene cookie (primera visita después de que existiera la cookie, o la
// cookie de 2 h ya venció): emite la cookie y pide la página de nuevo, así
// no ve "necesitás iniciar sesión" estando logueado.
//
// Si la cookie no se puede emitir (servidor mal configurado, sin conexión),
// lo dice en vez de dejar al usuario mirando un "iniciá sesión" que no
// entiende — está logueado y la página igual no lo reconoce.
export default function SessionSync(): JSX.Element | null {
  const { user, loading } = useAuth();
  const router = useRouter();
  const tried = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (loading || !user || user.isAnonymous || tried.current) return;
    tried.current = true;
    void syncSessionCookie(user).then((ok) => {
      if (ok) router.refresh();
      else setFailed(true);
    });
  }, [loading, user, router]);

  if (!failed) return null;
  return (
    <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
      Iniciaste sesión, pero no pudimos verificarla en el servidor. Recargá la página; si sigue igual, cerrá
      sesión y volvé a entrar.
    </p>
  );
}
