// app/api/leaderboard/route.ts
//
// GET /api/leaderboard → top del ranking semanal y del histórico del modo
// libre. Público (lo muestra la landing antes de loguearse), por eso solo
// devuelve alias, personaje y puntaje: nunca uid ni email.
//
// Las colecciones del ranking no se pueden leer desde el cliente
// (firestore.rules): pasar por acá permite cachear y decidir qué se expone.
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { readLeaderboard } from '@/lib/leaderboardServer';
import { errorCode } from '@/lib/routeErrors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await readLeaderboard(getFirestore(getAdminApp()));
    return NextResponse.json(data, {
      // La CDN lo sirve un minuto sin volver a preguntar; la landing tiene mucho tráfico.
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('❌ Error en GET /api/leaderboard:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', code: errorCode(err) }, { status: 500 });
  }
}
