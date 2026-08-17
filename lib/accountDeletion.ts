import { signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebaseAuth';

/**
 * Llama a /api/delete-account (borrado real server-side vía Admin SDK) y
 * después limpia todo lo local. El orden importa: primero el servidor
 * confirma que borró todo, recién ahí limpiamos acá — si el fetch falla,
 * no queremos dejar a alguien pensando que se borró su cuenta cuando en
 * realidad sigue intacta del lado de Firebase.
 */
export async function deleteMyAccount(user: User): Promise<void> {
  const idToken = await user.getIdToken();

  const res = await fetch('/api/delete-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'SERVER_ERROR');
  }

  try {
    localStorage.removeItem('cresi_user_data');
    localStorage.removeItem('cresi_profile');
  } catch {
    // Sin localStorage (modo privado, etc.) — no es crítico, la cuenta ya
    // se borró del lado del servidor de todos modos.
  }

  try {
    await signOut(auth);
  } catch {
    // El usuario de Firebase ya no existe — signOut puede fallar acá,
    // no cambia el resultado (la sesión local se limpia igual abajo).
  }

  window.dispatchEvent(new Event('cresi-session-updated'));
}
