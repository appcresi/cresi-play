// lib/sessionClient.ts
//
// Mantiene la cookie de sesión del servidor (lib/session.ts) alineada con la
// sesión de Firebase del navegador. Lo llama AuthContext cada vez que cambia
// el ID token (login, logout y la renovación horaria de Firebase).
import type { User } from 'firebase/auth';

// Marca local de "este navegador tiene (o tuvo) cookie de sesión". Solo
// sirve para no mandar un DELETE en cada carga de página de los visitantes
// anónimos (la mayoría del tráfico) — no tiene ningún valor de seguridad.
const HAS_COOKIE_KEY = 'cresi_session_cookie';

const remember = (value: boolean) => {
  try {
    if (value) localStorage.setItem(HAS_COOKIE_KEY, '1');
    else localStorage.removeItem(HAS_COOKIE_KEY);
  } catch {
    // Sin localStorage (modo privado, etc.): la sincronización sigue andando.
  }
};

const hadCookie = (): boolean => {
  try {
    return localStorage.getItem(HAS_COOKIE_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * Con usuario logueado (no anónimo) emite/renueva la cookie; sin usuario, la
 * borra. Nunca lanza: si falla, el sitio sigue funcionando igual (solo las
 * páginas que dependen de la sesión del servidor no reconocen al usuario).
 * Devuelve true si quedó una cookie válida.
 */
export async function syncSessionCookie(user: User | null): Promise<boolean> {
  try {
    if (!user || user.isAnonymous) {
      if (hadCookie()) {
        await fetch('/api/session', { method: 'DELETE' });
        remember(false);
      }
      return false;
    }

    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
    if (!res.ok) {
      // Ej.: SERVER_MISCONFIGURED / SESSION_SECRET = falta configurar el secreto en el servidor.
      const detail = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      console.warn('⚠️ /api/session respondió', res.status, detail.error ?? '', detail.code ?? '');
      return false;
    }
    remember(true);
    return true;
  } catch (err) {
    console.warn('⚠️ No se pudo sincronizar la sesión con el servidor:', err);
    return false;
  }
}
