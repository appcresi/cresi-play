// app/api/leaderboard/me/route.ts
//
// GET  → si puede estar en el ranking, si se sumó, su alias y su posición.
// POST { join: boolean } → sumarse o darse de baja (un invitado que se da de
// baja pierde su documento de `users`: solo existía por el ranking).
//
// Aparecer en el ranking es voluntario (plataforma para adolescentes): nadie
// entra solo por jugar. La marca `users/{uid}.leaderboard.optIn` la escribe
// solo este servidor — las reglas no dejan que el cliente la toque, así un
// alumno de una clase no puede sumarse desde la consola salteando el control
// de `eligibleFor`.
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { errorCode } from '@/lib/routeErrors';
import {
  deleteEntriesInTx,
  eligibleFor,
  invalidateLeaderboardCache,
  isGuestToken,
  readMe,
  writeEntriesInTx,
} from '@/lib/leaderboardServer';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

async function verify(req: NextRequest): Promise<DecodedIdToken | NextResponse> {
  const authHeader = req.headers.get('authorization');
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return NextResponse.json({ error: 'MISSING_TOKEN' }, { status: 401, headers: noStore });
  try {
    return await getAuth(getAdminApp()).verifyIdToken(idToken);
  } catch (err) {
    console.warn('⚠️ /api/leaderboard/me: token rechazado:', errorCode(err));
    return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401, headers: noStore });
  }
}

export async function GET(req: NextRequest) {
  try {
    const decoded = await verify(req);
    if (decoded instanceof NextResponse) return decoded;

    const db = getFirestore(getAdminApp());
    const snap = await db.collection('users').doc(decoded.uid).get();
    if (!snap.exists) {
      // Invitado que nunca se sumó: su progreso vive solo en el navegador.
      return NextResponse.json(await readMe(db, decoded.uid, {}, decoded), { headers: noStore });
    }
    return NextResponse.json(await readMe(db, decoded.uid, snap.data() ?? {}, decoded), { headers: noStore });
  } catch (err) {
    console.error('❌ Error en GET /api/leaderboard/me:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', code: errorCode(err) }, { status: 500, headers: noStore });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decoded = await verify(req);
    if (decoded instanceof NextResponse) return decoded;

    const body = (await req.json().catch(() => null)) as { join?: unknown } | null;
    if (typeof body?.join !== 'boolean') {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400, headers: noStore });
    }
    const join = body.join;

    const db = getFirestore(getAdminApp());
    const userRef = db.collection('users').doc(decoded.uid);

    const outcome = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      // El cliente crea el documento antes de sumarse (lib/leaderboardClient.ts).
      if (!snap.exists) return 'USER_NOT_FOUND' as const;
      const data = snap.data() ?? {};

      if (!join) {
        deleteEntriesInTx(tx, db, decoded.uid, data);
        if (isGuestToken(decoded)) {
          // Un invitado solo tenía datos acá por el ranking (ver canSync en
          // lib/userDataSync.ts): al salir se borran y su progreso vuelve a
          // vivir solo en su navegador.
          tx.delete(userRef);
        } else {
          tx.update(userRef, { 'leaderboard.optIn': false, 'leaderboard.weeks': FieldValue.delete() });
        }
        return 'OK' as const;
      }

      if (!eligibleFor(data, decoded)) return 'NOT_ELIGIBLE' as const;
      const score = Math.max(0, Math.floor(Number(data.game?.totalScore) || 0));
      // Lo jugado antes de sumarse no cuenta para la semana: arranca en 0.
      const extra = writeEntriesInTx(tx, db, decoded.uid, data, decoded, score, 0);
      tx.update(userRef, {
        'leaderboard.optIn': true,
        'leaderboard.since': data.leaderboard?.since ?? new Date().toISOString(),
        ...extra,
      });
      return 'OK' as const;
    });

    if (outcome === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: outcome }, { status: 404, headers: noStore });
    }
    if (outcome === 'NOT_ELIGIBLE') {
      return NextResponse.json({ error: outcome }, { status: 403, headers: noStore });
    }

    invalidateLeaderboardCache();
    const fresh = await userRef.get();
    return NextResponse.json(await readMe(db, decoded.uid, fresh.data() ?? {}, decoded), { headers: noStore });
  } catch (err) {
    console.error('❌ Error en POST /api/leaderboard/me:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', code: errorCode(err) }, { status: 500, headers: noStore });
  }
}
