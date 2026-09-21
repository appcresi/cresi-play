// lib/session.ts
//
// Sesión verificada en el servidor (capa de acceso a datos, "DAL", como
// recomienda la guía de autenticación de Next). Antes el proyecto no tenía
// ninguna: toda la identidad vivía en el navegador (Firebase Auth cliente +
// un "rol" en localStorage), así que los Server Components no tenían forma
// de saber quién pedía la página y las páginas docentes eran todo
// `'use client'`.
//
// Cómo funciona: cuando el usuario inicia sesión, el cliente le manda su ID
// token de Firebase a /api/session, que lo verifica y le devuelve esta
// cookie firmada (lib/sessionToken.ts). Los Server Components la leen acá.
//
// IMPORTANTE — dos reglas para no crear agujeros:
// 1. La cookie dice QUIÉN es el usuario, no qué puede hacer. Cada consulta
//    del servidor con el Admin SDK (que ignora las reglas de Firestore) tiene
//    que filtrar por `session.uid` ella misma.
// 2. Las rutas de API que CAMBIAN datos siguen usando el token en la
//    cabecera Authorization (no esta cookie): así no son vulnerables a CSRF.
import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { SESSION_TTL_SECONDS, createSessionToken, verifySessionToken } from '@/lib/sessionToken';
import { createRevocationChecker, type AuthState } from '@/lib/sessionRevocation';

export const SESSION_COOKIE = 'cresi_session';

export interface Session {
  uid: string;
  /** Alumno que entró con código de clase: no usa las funciones de docente. */
  student: boolean;
}

export async function setSessionCookie(uid: string, options: { student?: boolean } = {}): Promise<{ expiresAt: number }> {
  const { token, payload } = createSessionToken(uid, { student: options.student });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return { expiresAt: payload.exp };
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

// Estado del usuario en Firebase Auth, para la revocación (lib/sessionRevocation.ts).
async function fetchAuthState(uid: string): Promise<AuthState | null> {
  try {
    const user = await getAuth(getAdminApp()).getUser(uid);
    const validSince = user.tokensValidAfterTime ? Date.parse(user.tokensValidAfterTime) : NaN;
    return { disabled: user.disabled, validSinceSeconds: Number.isNaN(validSince) ? null : Math.floor(validSince / 1000) };
  } catch (err) {
    if ((err as { code?: string }).code === 'auth/user-not-found') return null;
    throw err;
  }
}

// SESSION_REVOCATION_TTL_MS: cada cuánto se vuelve a preguntar por usuario
// (60 s por defecto; las pruebas lo bajan a 0 para ver la revocación al instante).
const isSessionRevoked = createRevocationChecker(fetchAuthState, {
  ttlMs: Number(process.env.SESSION_REVOCATION_TTL_MS ?? 60_000),
  onError: (err) => console.error('❌ No se pudo consultar el estado del usuario para la sesión:', err),
});

/**
 * Sesión del pedido actual, o null. Memoizada por render (React `cache`).
 * Además de la firma y el vencimiento de la cookie, comprueba que el usuario
 * no haya sido revocado, deshabilitado o borrado.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  if (await isSessionRevoked(payload.uid, payload.iat)) return null;
  return { uid: payload.uid, student: payload.stu === true };
});

/** Para páginas que no tienen sentido sin sesión: redirige si no hay. */
export async function requireSession(redirectTo: string = '/docente'): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(redirectTo);
  return session;
}
