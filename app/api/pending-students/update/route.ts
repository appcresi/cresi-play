// app/api/pending-students/update/route.ts
//
// Cambiar el usuario y/o la contraseña de un alumno pendiente. La
// contraseña nueva se guarda cifrada; si el documento todavía tenía la
// vieja en texto plano (`password`), se borra.
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { encryptPassword, loadKey } from '@/lib/passwordCrypto';
import { authorizeClassroomTeacher, cleanCredential, serverError, usernameKey } from '@/lib/pendingStudentsServer';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      classroomId?: unknown;
      pendingId?: unknown;
      username?: unknown;
      password?: unknown;
    } | null;
    const auth = await authorizeClassroomTeacher(req, body?.classroomId);
    if (!auth.ok) return auth.response;

    if (typeof body?.pendingId !== 'string' || body.pendingId === '') {
      return NextResponse.json({ error: 'MISSING_PENDING_ID' }, { status: 400 });
    }

    const username = body.username === undefined ? undefined : cleanCredential(body.username);
    const password = body.password === undefined ? undefined : cleanCredential(body.password);
    if (username === null || password === null || (username === undefined && password === undefined)) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 400 });
    }

    const collectionRef = auth.classroomRef.collection('estudiantesPendientes');
    const pendingRef = collectionRef.doc(body.pendingId);
    const pendingSnap = await pendingRef.get();
    if (!pendingSnap.exists) return NextResponse.json({ error: 'PENDING_NOT_FOUND' }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (username !== undefined) {
      const others = await collectionRef.get();
      const duplicated = others.docs.some((d) => d.id !== pendingRef.id && usernameKey(d.data().username) === usernameKey(username));
      if (duplicated) return NextResponse.json({ error: 'DUPLICATE_USERNAME' }, { status: 409 });
      updates.username = username;
    }

    if (password !== undefined) {
      updates.passwordEnc = encryptPassword(password, loadKey());
      updates.password = FieldValue.delete();
    }

    await pendingRef.update(updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError('/api/pending-students/update', err);
  }
}
