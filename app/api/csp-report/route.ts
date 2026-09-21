// app/api/csp-report/route.ts
//
// Recibe los informes de violación de la política de seguridad de contenido
// (ver lib/securityHeaders.js). La política está en modo SOLO OBSERVACIÓN: el
// navegador NO bloquea nada, solo avisa acá qué habría bloqueado. Se registra
// UNA línea por combinación (directiva + origen + ruta) en el log del
// servidor; con unos días de logs se ve qué orígenes legítimos faltan en la
// política y recién ahí se pasa a modo que bloquea.
//
// Es público (los navegadores no mandan credenciales) y por eso acota lo que
// acepta: tamaño máximo, sin parámetros ni URLs completas en el log, y no
// escribe nada en la base.
import { NextRequest, NextResponse } from 'next/server';
import { createDedupe, describeViolation, parseCspReport } from '@/lib/cspReport';

const MAX_BODY_BYTES = 10_000;
const isNew = createDedupe();

const empty = (status: number) => new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(req: NextRequest) {
  const text = await req.text().catch(() => '');
  if (text.length > MAX_BODY_BYTES) return empty(413);

  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    return empty(204); // un informe roto no merece un error: el navegador no lo va a reintentar
  }

  for (const violation of parseCspReport(body)) {
    if (isNew(violation)) console.warn(`🛡️ CSP (observación): ${describeViolation(violation)}`);
  }
  return empty(204);
}
