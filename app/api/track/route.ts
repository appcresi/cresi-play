// app/api/track/route.ts
//
// Suma los contadores públicos: partidas de una trivia, lecciones completadas,
// descargas y "en qué se equivocan más" (ver lib/track.ts para el porqué).
// Es público a propósito (la mayoría de quien juega es anónimo), así que
// acota lo que hace: solo esos cuatro incrementos de +1, solo sobre
// documentos que YA existen, con ids y campos validados, y con un tope de
// eventos por IP y por elemento (mejor esfuerzo, en memoria).
//
// Responde 204 sin cuerpo: es "dispará y olvidá" para el navegador.
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { collectionFor, limitRuleFor, parseTrackEvent, type TrackEvent } from '@/lib/track';
import { createMemoryStore, findBlocked, recordFailure } from '@/lib/rateLimit';
import { errorCode } from '@/lib/routeErrors';

const MAX_BODY_BYTES = 1_000;
const MAX_TRACKED_KEYS = 20_000;

// Contadores en memoria de ESTA instancia (mejor esfuerzo, ver lib/track.ts).
// Se reinician al llegar al tope para que la memoria no crezca sin límite.
let limiter = createMemoryStore();

const respond = (status: number, error?: string) =>
  error
    ? NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
    : new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } });

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** Los campos a sumar para cada evento: siempre +1, nunca un valor que venga del cliente. */
function updatesFor(event: TrackEvent): Record<string, FieldValue> {
  switch (event.kind) {
    case 'trivia-play':
      return { playCount: FieldValue.increment(1) };
    case 'lesson-complete':
      return { timesCompleted: FieldValue.increment(1) };
    case 'download':
      return { downloads: FieldValue.increment(1) };
    case 'question-stat':
      return {
        [`questionStats.${event.index}.shown`]: FieldValue.increment(1),
        [`questionStats.${event.index}.wrong`]: FieldValue.increment(event.correct ? 0 : 1),
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return respond(413, 'PAYLOAD_TOO_LARGE');

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return respond(400, 'INVALID_JSON');
    }
    const event = parseTrackEvent(body);
    if (!event) return respond(400, 'INVALID_EVENT');

    if (limiter.size() > MAX_TRACKED_KEYS) limiter = createMemoryStore();
    const rule = limitRuleFor(event, getClientIp(req));
    if (await findBlocked(limiter, [rule])) return respond(429, 'TOO_MANY_EVENTS');
    await recordFailure(limiter, [rule]);

    try {
      // `update` falla si el documento no existe: este endpoint nunca crea nada.
      await getFirestore(getAdminApp()).collection(collectionFor(event)).doc(event.id).update(updatesFor(event));
    } catch (err) {
      if (errorCode(err) === '5') return respond(404, 'NOT_FOUND'); // gRPC NOT_FOUND
      throw err;
    }
    return respond(204);
  } catch (err) {
    console.error('❌ Error en /api/track:', err);
    return respond(500, 'SERVER_ERROR');
  }
}
