// lib/leaderboardClient.ts
//
// Lado navegador del ranking del modo libre: leer el ranking, sumarse o
// bajarse, y pasar un invitado a Google sin perder lo jugado.
import {
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
  type OAuthCredential,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebaseAuth';
import UserDataManager from '@/lib/userDataManager';
import UserDataSync from '@/lib/userDataSync';
import { trackEvent } from '@/lib/analytics';
import type { LeaderboardMe, LeaderboardResponse } from '@/lib/leaderboard';

export async function fetchLeaderboard(): Promise<LeaderboardResponse> {
  const res = await fetch('/api/leaderboard');
  if (!res.ok) throw new Error(`LEADERBOARD_${res.status}`);
  return res.json();
}

async function callMe(method: 'GET' | 'POST', body?: unknown): Promise<Response> {
  const user = auth.currentUser;
  if (!user) throw new Error('NO_SESSION');
  const send = async (forceRefresh: boolean) =>
    fetch('/api/leaderboard/me', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await user.getIdToken(forceRefresh)}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const res = await send(false);
  return res.status === 401 ? send(true) : res;
}

/** Estado propio; null si no hay sesión. */
export async function fetchMyRanking(): Promise<LeaderboardMe | null> {
  if (!auth.currentUser) return null;
  const res = await callMe('GET');
  if (!res.ok) throw new Error(`LEADERBOARD_ME_${res.status}`);
  return res.json();
}

function setLocalOptIn(optIn: boolean): void {
  const data = UserDataManager.loadUserData();
  data.leaderboard = { optIn, since: optIn ? data.leaderboard?.since ?? new Date().toISOString() : undefined };
  UserDataManager.saveUserData(data);
  window.dispatchEvent(new Event('cresi-session-updated'));
}

/**
 * Sumarse al ranking. Un invitado hasta ahora no tenía nada en Firestore:
 * primero se crea su documento (y se sube el puntaje por /api/sync-score),
 * después el servidor lo anota.
 */
export async function joinLeaderboard(): Promise<LeaderboardMe> {
  setLocalOptIn(true);
  try {
    await UserDataSync.syncCompleteData(UserDataManager.loadUserData());
    const res = await callMe('POST', { join: true });
    if (!res.ok) {
      const { error } = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(error ?? `LEADERBOARD_JOIN_${res.status}`);
    }
    trackEvent('leaderboard_join', { guest: auth.currentUser?.isAnonymous ?? false });
    return res.json();
  } catch (err) {
    setLocalOptIn(false);
    throw err;
  }
}

export async function leaveLeaderboard(): Promise<LeaderboardMe> {
  const res = await callMe('POST', { join: false });
  if (!res.ok) throw new Error(`LEADERBOARD_LEAVE_${res.status}`);
  setLocalOptIn(false);
  trackEvent('leaderboard_leave');
  return res.json();
}

export type LinkResult =
  | { status: 'linked' }
  | { status: 'cancelled' }
  /** Ese Gmail ya tiene cuenta en CrESI: hay que elegir (ver `switchToExistingAccount`). */
  | { status: 'in-use'; credential: OAuthCredential };

/**
 * Pasa un invitado a cuenta de Google. `linkWithPopup` conserva el MISMO uid,
 * así que todo lo jugado (puntaje, racha, notas, lugar en el ranking) sigue
 * ahí; antes, entrar con Google creaba otra cuenta y se perdía.
 */
export async function linkGuestWithGoogle(): Promise<LinkResult> {
  const user = auth.currentUser;
  if (!user || !user.isAnonymous) return { status: 'linked' };

  try {
    await linkWithPopup(user, new GoogleAuthProvider());
  } catch (err) {
    const code = err instanceof FirebaseError ? err.code : '';
    if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
      const credential = GoogleAuthProvider.credentialFromError(err as FirebaseError);
      if (credential) return { status: 'in-use', credential };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { status: 'cancelled' };
    }
    throw err;
  }

  // Token nuevo (ya no dice "anonymous"): la cookie de sesión y el servidor lo ven como cuenta real.
  await user.getIdToken(true);
  const data = UserDataManager.loadUserData();
  await UserDataSync.syncCompleteData(data);
  if (data.leaderboard?.optIn) {
    // Que su fila deje de decir "invitado".
    await callMe('POST', { join: true }).catch(() => undefined);
  }
  trackEvent('link_account', { method: 'google', in_leaderboard: Boolean(data.leaderboard?.optIn) });
  window.dispatchEvent(new Event('cresi-session-updated'));
  return { status: 'linked' };
}

/**
 * El Gmail ya tenía cuenta: se entra con esa y lo jugado como invitado se
 * deja atrás (se avisa antes en la pantalla). Si el invitado estaba en el
 * ranking, primero se lo saca para no dejar una fila huérfana.
 */
export async function switchToExistingAccount(credential: OAuthCredential): Promise<void> {
  const guest = UserDataManager.loadUserData();
  if (guest.leaderboard?.optIn) {
    await callMe('POST', { join: false }).catch(() => undefined);
  }

  await signInWithCredential(auth, credential);
  const existing = await UserDataSync.loadFromFirestore();
  if (existing?.profile) {
    localStorage.setItem('cresi_user_data', JSON.stringify(existing));
  } else {
    // Cuenta sin datos guardados todavía: sigue con el perfil actual, sin el progreso del invitado.
    const fresh = UserDataManager.getDefaultUserData();
    fresh.profile = { ...guest.profile, lastLogin: new Date().toISOString() };
    fresh.dashboard = guest.dashboard;
    UserDataManager.saveUserData(fresh);
  }
  trackEvent('login', { method: 'google', role: 'student', from: 'guest_link' });
  window.dispatchEvent(new Event('cresi-session-updated'));
}
