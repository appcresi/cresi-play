// app/api/delete-account/route.ts
//
// Borrado de cuenta, a pedido del propio usuario. Corre server-side con
// Firebase Admin por dos motivos:
// 1. `deleteUser()` del SDK de cliente exige "recent login" — si la sesión
//    no es reciente, falla. Acá no hace falta: verificamos el ID token una
//    sola vez y el Admin SDK no tiene esa restricción.
// 2. La regla de Firestore de `users/{userId}` no deja que el propio
//    usuario borre su documento (solo admin) — bypasear reglas es
//    justamente para lo que existe el Admin SDK, así no hace falta
//    aflojar esa regla solo para este caso.
import { NextRequest, NextResponse } from 'next/server';
import {
  getFirestore,
  type Firestore,
  type CollectionReference,
  type DocumentReference,
} from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';

async function deleteAllDocs(ref: CollectionReference): Promise<void> {
  const snap = await ref.get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

// Borra una clase completa: tareas + sus entregas, alumnos, alumnos
// pendientes y la clase en sí. Antes esto no existía ni siquiera para el
// borrado manual de una clase (`classroomService.deleteClassroom` deja
// `tareas`/`entregas` huérfanas) — acá se hace bien porque hace falta para
// el borrado de cuenta en cascada.
async function deleteClassroomCascade(classroomRef: DocumentReference): Promise<void> {
  const tareasSnap = await classroomRef.collection('tareas').get();
  await Promise.all(
    tareasSnap.docs.map(async (tareaDoc) => {
      await deleteAllDocs(tareaDoc.ref.collection('entregas') as CollectionReference);
      await tareaDoc.ref.delete();
    })
  );

  await Promise.all([
    deleteAllDocs(classroomRef.collection('estudiantes') as CollectionReference),
    deleteAllDocs(classroomRef.collection('estudiantesPendientes') as CollectionReference),
  ]);

  await classroomRef.delete();
}

// Recorre TODAS las clases buscando la huella de un alumno — no hay forma
// más directa de saber a qué clases perteneció históricamente (puede haber
// jugado en más de una), y a esta escala (decenas/cientos de clases) es
// perfectamente aceptable en vez de mantener un índice aparte.
async function deleteStudentFootprint(db: Firestore, uid: string): Promise<void> {
  const classroomsSnap = await db.collection('classrooms').get();

  await Promise.all(
    classroomsSnap.docs.map(async (classroomDoc) => {
      const studentRef = classroomDoc.ref.collection('estudiantes').doc(uid);
      // El id del doc en estudiantesPendientes ES el uid (ver
      // app/api/join-class/route.ts) — no hace falta buscar por campo.
      const pendingRef = classroomDoc.ref.collection('estudiantesPendientes').doc(uid);

      const [studentSnap, pendingSnap] = await Promise.all([studentRef.get(), pendingRef.get()]);

      if (studentSnap.exists) {
        const tareasSnap = await classroomDoc.ref.collection('tareas').get();
        await Promise.all(
          tareasSnap.docs.map(async (tareaDoc) => {
            const entregaRef = tareaDoc.ref.collection('entregas').doc(uid);
            const entregaSnap = await entregaRef.get();
            if (entregaSnap.exists) await entregaRef.delete();
          })
        );
        await studentRef.delete();
      }

      // Contiene usuario/contraseña en texto plano asignados por el
      // docente — se borra entero, no solo se desvincula.
      if (pendingSnap.exists) {
        await pendingRef.delete();
      }
    })
  );
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: 'MISSING_TOKEN' }, { status: 401 });
    }

    const app = getAdminApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const roleFromProfile = userSnap.exists ? (userSnap.data()?.profile?.role as string | undefined) : undefined;

    const ownedClassroomsSnap = await db.collection('classrooms').where('profesorId', '==', uid).get();
    const isTeacher = roleFromProfile === 'teacher' || !ownedClassroomsSnap.empty;

    if (isTeacher) {
      await Promise.all(ownedClassroomsSnap.docs.map((d) => deleteClassroomCascade(d.ref)));

      const [triviaSnap, completaSnap] = await Promise.all([
        db.collection('trivia').where('author', '==', uid).get(),
        db.collection('completapalabras').where('author', '==', uid).get(),
      ]);
      await Promise.all([
        ...triviaSnap.docs.map((d) => d.ref.delete()),
        ...completaSnap.docs.map((d) => d.ref.delete()),
      ]);
    } else {
      await deleteStudentFootprint(db, uid);
    }

    if (userSnap.exists) {
      await userRef.delete();
    }

    await auth.deleteUser(uid);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('❌ Error en /api/delete-account:', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
