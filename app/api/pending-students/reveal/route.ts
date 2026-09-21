// app/api/pending-students/reveal/route.ts
//
// Devuelve la contraseña de un alumno pendiente, solo al docente dueño de
// la clase. Es lo que usa el botón "ver" de CredentialsModal: el cliente
// ya no lee la contraseña de Firestore, la pide acá cuando hace falta.
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { encryptPassword, loadKey, readStoredPassword } from '@/lib/passwordCrypto';
import { authorizeClassroomTeacher, serverError } from '@/lib/pendingStudentsServer';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { classroomId?: unknown; pendingId?: unknown } | null;
    const auth = await authorizeClassroomTeacher(req, body?.classroomId);
    if (!auth.ok) return auth.response;

    if (typeof body?.pendingId !== 'string' || body.pendingId === '') {
      return NextResponse.json({ error: 'MISSING_PENDING_ID' }, { status: 400 });
    }

    const pendingRef = auth.classroomRef.collection('estudiantesPendientes').doc(body.pendingId);
    const snap = await pendingRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'PENDING_NOT_FOUND' }, { status: 404 });

    const stored = readStoredPassword(snap.data() ?? {});
    if (!stored) return NextResponse.json({ error: 'NO_PASSWORD' }, { status: 404 });

    // Documento viejo en texto plano: se aprovecha para cifrarlo. Si la
    // clave todavía no está configurada, igual se devuelve la contraseña
    // (no se rompe el flujo del docente) y queda para más adelante.
    if (stored.legacy) {
      try {
        await pendingRef.update({ passwordEnc: encryptPassword(stored.password, loadKey()), password: FieldValue.delete() });
      } catch (err) {
        console.warn('⚠️ No se pudo cifrar una contraseña vieja al mostrarla:', err);
      }
    }

    return NextResponse.json({ password: stored.password });
  } catch (err) {
    return serverError('/api/pending-students/reveal', err);
  }
}
