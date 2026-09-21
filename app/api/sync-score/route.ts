// app/api/sync-score/route.ts
//
// Único camino para subir `users/{uid}.game.totalScore`. El cliente calcula
// el puntaje en el navegador, así que las reglas de Firestore ya no le dejan
// escribirlo directo (ver firestore.rules): lo manda acá y el servidor
// decide cuánto aceptar.
//
// La validación es por TASA, no por evento: el aumento aceptado está acotado
// por el tiempo transcurrido desde el último sync. No prueba que cada punto
// sea legítimo, pero impide saltos (setear millones de una) y el goteo
// rápido. Bajar el puntaje siempre se acepta (compras de vidas, penalidades).
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { errorCode } from '@/lib/routeErrors';

// Cubeta de fichas: el "presupuesto" de aumento se recarga a POINTS_PER_SECOND
// hasta MAX_BUDGET y se consume al subir el puntaje. Guardarlo (en
// game.scoreBudget) evita que llamar la ruta en bucle regale un margen fijo
// en cada llamada.
const INITIAL_BUDGET = 1000;
const POINTS_PER_SECOND = 5;
const MAX_BUDGET = 20000;
// Usuarios sin presupuesto guardado y sin timestamp de último sync legible.
const UNKNOWN_HISTORY_BUDGET = 5000;

export async function POST(req: NextRequest) {
  // Dónde estaba cuando falló: va al log y al cuerpo del 500 para poder
  // diagnosticar sin adivinar.
  let step = 'start';
  try {
    const authHeader = req.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: 'MISSING_TOKEN' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { score?: unknown } | null;
    const requested = body?.score;
    if (typeof requested !== 'number' || !Number.isInteger(requested) || requested < 0) {
      return NextResponse.json({ error: 'INVALID_SCORE' }, { status: 400 });
    }

    step = 'admin-init';
    const app = getAdminApp();

    step = 'verify-token';
    let decoded;
    try {
      decoded = await getAuth(app).verifyIdToken(idToken);
    } catch (err) {
      // Un token vencido o mal formado es culpa de quien llama (401), no un
      // error del servidor: antes salía como 500 y parecía una caída.
      console.warn('⚠️ /api/sync-score: token rechazado:', errorCode(err));
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 });
    }

    step = 'transaction';
    const db = getFirestore(app);
    const userRef = db.collection('users').doc(decoded.uid);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) return null;

      const data = snap.data() ?? {};
      // Si falta (documentos viejos) se trata como 0 y se crea acá.
      const previous = Number(data.game?.totalScore) || 0;
      const now = Date.now();

      const lastSync =
        Number(data.game?.scoreSyncedAt) ||
        Date.parse(data.lastSyncedAt ?? data.updatedAt ?? '') ||
        null;
      const storedBudget = Number(data.game?.scoreBudget);

      const elapsed = lastSync === null ? 0 : Math.max(0, (now - lastSync) / 1000);
      const budget = Number.isFinite(storedBudget)
        ? Math.min(MAX_BUDGET, storedBudget + elapsed * POINTS_PER_SECOND)
        : lastSync === null
          ? UNKNOWN_HISTORY_BUDGET
          : Math.min(MAX_BUDGET, INITIAL_BUDGET + elapsed * POINTS_PER_SECOND);

      const accepted = requested <= previous
        ? requested
        : Math.min(requested, previous + Math.floor(budget));
      const spent = Math.max(0, accepted - previous);

      tx.update(userRef, {
        'game.totalScore': accepted,
        'game.scoreSyncedAt': now,
        'game.scoreBudget': Math.floor(budget - spent)
      });
      return { accepted, clamped: accepted < requested };
    });

    if (result === null) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    if (result.clamped) {
      console.warn(`⚠️ /api/sync-score: puntaje recortado para ${decoded.uid} (pidió ${requested}, aceptado ${result.accepted})`);
    }

    return NextResponse.json({ ok: true, score: result.accepted, clamped: result.clamped });
  } catch (err) {
    console.error(`❌ Error en /api/sync-score (paso: ${step}):`, err);
    return NextResponse.json({ error: 'SERVER_ERROR', step, code: errorCode(err) }, { status: 500 });
  }
}
