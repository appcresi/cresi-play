// app/api/pending-students/route.ts
//
// Alta de alumnos "pendientes" (usuario + contraseña que arma el docente).
// Antes el cliente escribía la contraseña en texto plano directo a
// Firestore; ahora la cifra el servidor y las reglas ya no dejan crear
// estos documentos desde el cliente.
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { encryptPassword, loadKey } from '@/lib/passwordCrypto';
import { authorizeClassroomTeacher, cleanCredential, serverError, usernameKey } from '@/lib/pendingStudentsServer';

const MAX_BATCH = 200;

interface SkippedStudent {
  username: string;
  reason: 'INVALID' | 'DUPLICATE_USERNAME';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { classroomId?: unknown; students?: unknown } | null;
    const auth = await authorizeClassroomTeacher(req, body?.classroomId);
    if (!auth.ok) return auth.response;

    const students = body?.students;
    if (!Array.isArray(students) || students.length === 0 || students.length > MAX_BATCH) {
      return NextResponse.json({ error: 'INVALID_STUDENTS' }, { status: 400 });
    }

    const key = loadKey();
    const collectionRef = auth.classroomRef.collection('estudiantesPendientes');
    const existing = await collectionRef.get();
    const taken = new Set(existing.docs.map((d) => usernameKey(d.data().username)));

    const skipped: SkippedStudent[] = [];
    let added = 0;

    for (const raw of students as Array<{ username?: unknown; password?: unknown }>) {
      const username = cleanCredential(raw?.username);
      const password = cleanCredential(raw?.password);
      if (!username || !password) {
        skipped.push({ username: String(raw?.username ?? ''), reason: 'INVALID' });
        continue;
      }
      if (taken.has(usernameKey(username))) {
        skipped.push({ username, reason: 'DUPLICATE_USERNAME' });
        continue;
      }

      await collectionRef.add({
        username,
        passwordEnc: encryptPassword(password, key),
        claimed: false,
        claimedUid: null,
        createdAt: FieldValue.serverTimestamp(),
      });
      taken.add(usernameKey(username));
      added += 1;
    }

    return NextResponse.json({ ok: true, added, skipped });
  } catch (err) {
    return serverError('/api/pending-students', err);
  }
}
