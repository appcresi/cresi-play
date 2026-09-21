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
import { SESSION_TTL_SECONDS, createSessionToken, verifySessionToken } from '@/lib/sessionToken';

export const SESSION_COOKIE = 'cresi_session';

export interface Session {
  uid: string;
}

export async function setSessionCookie(uid: string): Promise<{ expiresAt: number }> {
  const { token, payload } = createSessionToken(uid);
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

/** Sesión del pedido actual, o null. Memoizada por render (React `cache`). */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  return payload ? { uid: payload.uid } : null;
});

/** Para páginas que no tienen sentido sin sesión: redirige si no hay. */
export async function requireSession(redirectTo: string = '/docente'): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(redirectTo);
  return session;
}
