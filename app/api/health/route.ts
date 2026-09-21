// app/api/health/route.ts
//
// Comprueba que el servidor está bien configurado y puede usar Firebase Admin.
// La consulta el CI (.github/workflows/health.yml) después de cada deploy y
// cada 30 minutos, así una caída se detecta sola. Antes, un Node viejo dejó
// caídas `join-class`, `sync-score` y `session` y nadie se enteró hasta ver
// un 500 en la consola del navegador.
//
// Importa `firebase-admin/auth` arriba A PROPÓSITO: si el paquete no carga en
// este entorno (como pasó con `ERR_REQUIRE_ESM`), esta ruta también se cae y
// el monitor ve un no-200, igual que las rutas reales.
//
// GET /api/health          → configuración + Admin SDK (sin tocar la base).
// GET /api/health?deep=1   → además, una lectura mínima de Firestore. Exige
//                            `Authorization: Bearer <HEALTH_TOKEN>` para que
//                            nadie pueda usarla para gastar lecturas.
//
// Responde 200 si todo está bien y 503 si algo falla. Solo devuelve
// "ok"/"fail" por comprobación, nunca valores de configuración.
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { checkConfig, summarize, type CheckStatus } from '@/lib/health';
import { passwordsMatch } from '@/lib/passwordCrypto';

export const dynamic = 'force-dynamic';

const respond = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(req: NextRequest) {
  const checks: Record<string, CheckStatus> = checkConfig(process.env);

  const deep = req.nextUrl.searchParams.get('deep') === '1';
  if (deep) {
    const expected = process.env.HEALTH_TOKEN;
    const header = req.headers.get('authorization');
    const given = header?.startsWith('Bearer ') ? header.slice(7) : '';
    if (!expected || !passwordsMatch(given, expected)) {
      return respond({ error: 'DEEP_CHECK_NOT_AUTHORIZED' }, 401);
    }
  }

  // Admin SDK: se inicializa y se firma un token de prueba (es local, sin
  // red) — es lo que hace /api/join-class, así que detecta una clave privada
  // rota o mal pegada.
  try {
    await getAuth(getAdminApp()).createCustomToken('health-check');
    checks.adminSdk = 'ok';
  } catch {
    checks.adminSdk = 'fail';
  }

  if (deep) {
    try {
      await getFirestore(getAdminApp()).collection('classrooms').limit(1).select().get();
      checks.firestore = 'ok';
    } catch {
      checks.firestore = 'fail';
    }
  }

  const { ok, failing } = summarize(checks);
  return respond({ ok, checks, failing, node: process.version, deep }, ok ? 200 : 503);
}
