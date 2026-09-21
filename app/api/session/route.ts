// app/api/session/route.ts
//
// Emite y borra la cookie de sesión (ver lib/session.ts).
//
// POST   Authorization: Bearer <ID token de Firebase>  → cookie de 2 h.
//        Se llama al iniciar sesión y cada vez que Firebase renueva el
//        token (~1 h), así la cookie se mantiene mientras el usuario esté
//        activo y caduca sola cuando se va.
// DELETE → borra la cookie (cierre de sesión).
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { clearSessionCookie, setSessionCookie } from '@/lib/session';
import { SessionSecretError } from '@/lib/sessionToken';
import { errorCode } from '@/lib/routeErrors';

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get('authorization');
    const idToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!idToken) return json({ error: 'MISSING_TOKEN' }, 401);

    let decoded;
    try {
      // `true`: también rechaza tokens de cuentas deshabilitadas o con la
      // sesión revocada — es el único momento en que se consulta a Firebase.
      decoded = await getAuth(getAdminApp()).verifyIdToken(idToken, true);
    } catch {
      return json({ error: 'INVALID_TOKEN' }, 401);
    }

    // Los visitantes anónimos (la mayoría del tráfico del sitio público) no
    // tienen nada que ver en el servidor: no se les emite sesión.
    if (decoded.firebase?.sign_in_provider === 'anonymous') {
      return json({ error: 'ANONYMOUS_NOT_ALLOWED' }, 403);
    }

    const { expiresAt } = await setSessionCookie(decoded.uid);
    return json({ ok: true, expiresAt });
  } catch (err) {
    console.error('❌ Error en POST /api/session:', err);
    if (err instanceof SessionSecretError) return json({ error: 'SERVER_MISCONFIGURED', code: 'SESSION_SECRET' }, 500);
    return json({ error: 'SERVER_ERROR', code: errorCode(err) }, 500);
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return json({ ok: true });
}
