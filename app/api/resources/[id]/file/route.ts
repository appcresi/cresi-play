// app/api/resources/[id]/file/route.ts
//
// GET → { url } del archivo de un recurso, para descargarlo desde una tarea.
//
// El link vive en `resourceFiles/{id}`, que nadie puede leer desde el
// navegador (firestore.rules): así los recursos pagos no quedan a la vista
// en la colección pública `resources`. Dentro de una clase todos los
// recursos son gratis, así que acá alcanza con ser docente o alumno de una
// clase; quien juega por su cuenta los descarga (o compra) en cresi.com.ar.
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { errorCode } from '@/lib/routeErrors';

export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ error: 'MISSING_TOKEN' }, { status: 401, headers: noStore });

    const app = getAdminApp();
    let decoded;
    try {
      decoded = await getAuth(app).verifyIdToken(idToken);
    } catch (err) {
      console.warn('⚠️ /api/resources/file: token rechazado:', errorCode(err));
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401, headers: noStore });
    }

    const { id } = await params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
      return NextResponse.json({ error: 'INVALID_ID' }, { status: 400, headers: noStore });
    }

    const db = getFirestore(app);
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    const profile = userSnap.data()?.profile;
    const inClassroom =
      decoded.student === true ||
      profile?.role === 'teacher' ||
      (typeof profile?.classroomId === 'string' && profile.classroomId.length > 0);
    if (!inClassroom) {
      return NextResponse.json({ error: 'NOT_IN_CLASSROOM' }, { status: 403, headers: noStore });
    }

    const [fileSnap, resourceSnap] = await Promise.all([
      db.collection('resourceFiles').doc(id).get(),
      db.collection('resources').doc(id).get(),
    ]);
    if (!resourceSnap.exists) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404, headers: noStore });
    }
    // Recursos todavía sin migrar (scripts/migrate-resource-files.mjs) tienen el link en `resources`.
    const url = fileSnap.data()?.url ?? resourceSnap.data()?.url;
    if (typeof url !== 'string' || url.length === 0) {
      return NextResponse.json({ error: 'NO_FILE' }, { status: 404, headers: noStore });
    }

    return NextResponse.json({ url }, { headers: noStore });
  } catch (err) {
    console.error('❌ Error en GET /api/resources/file:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', code: errorCode(err) }, { status: 500, headers: noStore });
  }
}
