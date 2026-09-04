// lib/classroomService.ts
//
// Requiere las Firestore Security Rules actualizadas (ver firestore.rules):
// - `classrooms/{id}` con campo `profesorId`.
// - `classrooms/{id}/estudiantes/{uid}`: alumnos ya "reclamados" (uid real de Firebase Auth).
//   El docente (profesorId) y el propio alumno pueden escribir su documento.
// - `classrooms/{id}/estudiantesPendientes/{autoId}`: alumnos agregados manualmente por el
//   docente (nombre + contraseña) que todavía no iniciaron sesión. Se "reclaman" una sola vez.
import { db } from '@/lib/firebaseFirestore';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import type { Character } from '@/types/user';
import type { Classroom, StudentProgress, ClassroomStudent, PendingStudent } from '@/types/classroom';

export type { Character, Classroom, StudentProgress, ClassroomStudent, PendingStudent };

// Paleta estilo Google Classroom, se asigna una al crear la clase y queda fija.
export const CLASSROOM_COLORS = [
  '#1E88E5', '#039BE5', '#00897B', '#43A047', '#7CB342',
  '#C0CA33', '#FDD835', '#FFB300', '#FB8C00', '#F4511E',
  '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB',
];

function pickClassroomColor(): string {
  return CLASSROOM_COLORS[Math.floor(Math.random() * CLASSROOM_COLORS.length)];
}

// Para clases creadas antes de que existiera el campo `color`: mismo color
// siempre para la misma clase, en vez de random en cada carga.
function fallbackColorFor(id: string): string {
  const sum = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CLASSROOM_COLORS[sum % CLASSROOM_COLORS.length];
}

// Evitamos caracteres confusos: 0/O, 1/I
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function codeExists(code: string): Promise<boolean> {
  const q = query(collection(db, 'classrooms'), where('code', '==', code), limit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

const ClassroomService = {
  // ---------- Clase ----------

  async createClassroom(teacherId: string, name: string): Promise<Classroom> {
    let code = generateCode();
    for (let attempt = 0; attempt < 5 && (await codeExists(code)); attempt++) {
      code = generateCode();
    }
    const color = pickClassroomColor();

    const classroomRef = await addDoc(collection(db, 'classrooms'), {
      name,
      profesorId: teacherId,
      code,
      allowedActivities: null,
      visibleTrivias: null,
      visibleCompletaPalabras: null,
      restrictedTags: null,
      restrictedQuestionIds: null,
      restrictedInfografias: null,
      allowGoogleSignIn: false,
      color,
      createdAt: serverTimestamp(),
    });

    return {
      id: classroomRef.id,
      name,
      teacherId,
      code,
      createdAt: new Date().toISOString(),
      studentCount: 0,
      pendingCount: 0,
      allowedActivities: null,
      visibleTrivias: null,
      visibleCompletaPalabras: null,
      restrictedTags: null,
      restrictedQuestionIds: null,
      restrictedInfografias: null,
      allowGoogleSignIn: false,
      color,
    };
  },

  async updateClassroomName(classroomId: string, name: string): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId), { name });
  },

  /**
   * Define qué actividades puede ver la clase. `activityIds === null` quita
   * la restricción (los alumnos vuelven a ver todas las actividades).
   */
  async updateAllowedActivities(classroomId: string, activityIds: string[] | null): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId), { allowedActivities: activityIds });
  },

  /**
   * Lectura liviana usada por el lado del alumno para saber qué actividades
   * tiene habilitadas su clase, sin traer el resto de los datos de la clase.
   */
  async getAllowedActivities(classroomId: string): Promise<string[] | null> {
    const snap = await getDoc(doc(db, 'classrooms', classroomId));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return data.allowedActivities ?? null;
  },

  /**
   * Trae una clase individual completa (nombre, color, actividades...).
   * Pensada para el lado del ALUMNO (ClassroomDesk), que necesita mostrar
   * el nombre/color de su clase — a diferencia de getTeacherClassrooms,
   * que es para el listado completo del docente.
   */
  async getClassroomById(classroomId: string): Promise<Classroom | null> {
    const snap = await getDoc(doc(db, 'classrooms', classroomId));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return {
      id: snap.id,
      name: data.name,
      teacherId: data.profesorId,
      code: data.code,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      allowedActivities: data.allowedActivities ?? null,
      visibleTrivias: data.visibleTrivias ?? null,
      visibleCompletaPalabras: data.visibleCompletaPalabras ?? null,
      restrictedTags: data.restrictedTags ?? null,
      restrictedQuestionIds: data.restrictedQuestionIds ?? null,
      restrictedInfografias: data.restrictedInfografias ?? null,
      allowGoogleSignIn: data.allowGoogleSignIn ?? false,
      color: data.color ?? fallbackColorFor(snap.id),
    };
  },

  /**
   * IDs de las trivias del docente visibles en esta clase puntual.
   * `null` = sin restricción, se ven todas las que ese docente creó
   * (mismo criterio que allowedActivities para actividades).
   */
  async getVisibleTrivias(classroomId: string): Promise<string[] | null> {
    const snap = await getDoc(doc(db, 'classrooms', classroomId));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return data.visibleTrivias ?? null;
  },

  async updateVisibleTrivias(classroomId: string, triviaIds: string[] | null): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId), { visibleTrivias: triviaIds });
  },

  /**
   * IDs de lecciones de Completa Palabras (CrESI + propias del docente)
   * visibles en esta clase. `null` = sin restricción (todas visibles).
   */
  async getVisibleCompletaPalabras(classroomId: string): Promise<string[] | null> {
    const snap = await getDoc(doc(db, 'classrooms', classroomId));
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return data.visibleCompletaPalabras ?? null;
  },

  async updateVisibleCompletaPalabras(classroomId: string, lessonIds: string[] | null): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId), { visibleCompletaPalabras: lessonIds });
  },

  /**
   * Etiquetas del banco de preguntas bloqueadas ENTERAS para esta clase.
   * `null` = sin restricción, se ven todas las etiquetas.
   */
  async updateRestrictedTags(classroomId: string, tags: string[] | null): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId), { restrictedTags: tags });
  },

  /**
   * Preguntas puntuales bloqueadas, aunque su etiqueta esté permitida.
   * `null` = ninguna pregunta puntual bloqueada.
   */
  async updateRestrictedQuestionIds(classroomId: string, questionIds: string[] | null): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId), { restrictedQuestionIds: questionIds });
  },

  /**
   * Infografías bloqueadas para esta clase. `null` = ninguna bloqueada
   * (todas visibles) — mismo criterio "lista de bloqueadas" que
   * restrictedTags/restrictedQuestionIds: una infografía nueva que se
   * suba después queda visible por default.
   */
  async updateRestrictedInfografias(classroomId: string, infografiaIds: string[] | null): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId), { restrictedInfografias: infografiaIds });
  },

  /**
   * Prende/apaga que los alumnos de esta clase puedan unirse con su propia
   * cuenta de Google (alternativa al usuario/contraseña que asigna el
   * docente) — ver `upsertClassroomStudent` y app/clase/[codigo]/page.tsx.
   * Es un control solo de UX del lado del alumno, no una regla de
   * seguridad de Firestore: quien ya tiene el código de la clase de todos
   * modos podría unirse con usuario/contraseña, así que no hay nada
   * sensible detrás de este interruptor — mismo criterio que
   * MAX_SESSIONS_PER_TEACHER en wordCloudService.ts.
   */
  async updateAllowGoogleSignIn(classroomId: string, allow: boolean): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId), { allowGoogleSignIn: allow });
  },

  /**
   * Elimina la clase junto con sus alumnos (reclamados y pendientes).
   * Requiere que el docente tenga permiso de escritura sobre `estudiantes`
   * (ver regla actualizada) para poder limpiar la subcolección.
   * No borra `tareas`, ya que esas las gestiona su propio creador.
   */
  async deleteClassroom(classroomId: string): Promise<void> {
    const [studentsSnap, pendingSnap] = await Promise.all([
      getDocs(collection(db, 'classrooms', classroomId, 'estudiantes')),
      getDocs(collection(db, 'classrooms', classroomId, 'estudiantesPendientes')),
    ]);

    await Promise.all([
      ...studentsSnap.docs.map((d) => deleteDoc(d.ref)),
      ...pendingSnap.docs.map((d) => deleteDoc(d.ref)),
    ]);

    await deleteDoc(doc(db, 'classrooms', classroomId));
  },

  async getTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
    const q = query(collection(db, 'classrooms'), where('profesorId', '==', teacherId));
    const snap = await getDocs(q);

    // Antes este `for` esperaba cada clase antes de pasar a la siguiente
    // (await adentro del loop) — con 15-20 clases eran 15-20 pares de
    // lecturas en fila. Al pedirlas todas juntas con Promise.all, siguen
    // siendo las mismas lecturas, pero corren en paralelo: el tiempo total
    // pasa a ser el de la clase más lenta, no la suma de todas.
    const classrooms = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data() as any;
        const [studentsSnap, pendingSnap] = await Promise.all([
          getDocs(collection(db, 'classrooms', d.id, 'estudiantes')),
          getDocs(collection(db, 'classrooms', d.id, 'estudiantesPendientes')),
        ]);
        return {
          id: d.id,
          name: data.name,
          teacherId: data.profesorId,
          code: data.code,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
          studentCount: studentsSnap.size,
          pendingCount: pendingSnap.docs.filter((p) => !p.data().claimed).length,
          allowedActivities: data.allowedActivities ?? null,
          visibleTrivias: data.visibleTrivias ?? null,
          visibleCompletaPalabras: data.visibleCompletaPalabras ?? null,
          restrictedTags: data.restrictedTags ?? null,
          restrictedQuestionIds: data.restrictedQuestionIds ?? null,
          restrictedInfografias: data.restrictedInfografias ?? null,
          allowGoogleSignIn: data.allowGoogleSignIn ?? false,
          color: data.color ?? fallbackColorFor(d.id),
        };
      })
    );
    return classrooms;
  },

  // ---------- Alumnos ya unidos (código libre o ya reclamados) ----------

  async getClassroomStudents(classroomId: string): Promise<ClassroomStudent[]> {
    const snap = await getDocs(collection(db, 'classrooms', classroomId, 'estudiantes'));
    return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
  },

  async removeStudent(classroomId: string, studentUid: string): Promise<void> {
    await deleteDoc(doc(db, 'classrooms', classroomId, 'estudiantes', studentUid));
  },

  async validateCode(code: string): Promise<{ classroomId: string; className: string } | null> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return null;

    const q = query(collection(db, 'classrooms'), where('code', '==', normalized), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const d = snap.docs[0];
    return { classroomId: d.id, className: (d.data() as any).name };
  },

  async joinClassroom(
    classroomId: string,
    studentUid: string,
    username: string,
    character: Character
  ): Promise<void> {
    await setDoc(doc(db, 'classrooms', classroomId, 'estudiantes', studentUid), {
      username,
      character,
      joinedAt: serverTimestamp(),
      addedManually: false,
    });
  },

  // ---------- Alumnos agregados manualmente por el docente ----------

  async addPendingStudent(
    classroomId: string,
    username: string,
    password: string
  ): Promise<PendingStudent> {
    // Evita el caso que causaba alumnos "duplicados" en el panel: dos
    // registros con el mismo nombre, uno reclamado y otro fantasma que
    // nunca se usa. Comparamos sin distinguir mayúsculas.
    const normalizedUsername = username.trim().toLowerCase();
    const existingSnap = await getDocs(collection(db, 'classrooms', classroomId, 'estudiantesPendientes'));
    const alreadyExists = existingSnap.docs.some(
      (d) => String(d.data().username ?? '').trim().toLowerCase() === normalizedUsername
    );
    if (alreadyExists) {
      throw new Error('DUPLICATE_USERNAME');
    }

    const ref = await addDoc(collection(db, 'classrooms', classroomId, 'estudiantesPendientes'), {
      username,
      password,
      claimed: false,
      claimedUid: null,
      createdAt: serverTimestamp(),
    });
    return {
      id: ref.id,
      username,
      password,
      claimed: false,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Agrega varios alumnos de una: una línea por alumno, con el formato
   * "Nombre, contraseña" (separado por coma o tabulación).
   */
  async addPendingStudentsBulk(
    classroomId: string,
    lines: string[]
  ): Promise<{ added: number; skipped: string[] }> {
    let added = 0;
    const skipped: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const parts = line.split(/[,\t]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length < 2) {
        skipped.push(rawLine);
        continue;
      }

      const [username, password] = parts;
      if (username.length < 3 || password.length < 3) {
        skipped.push(rawLine);
        continue;
      }

      try {
        await this.addPendingStudent(classroomId, username, password);
        added += 1;
      } catch (err) {
        // Ya existe un alumno con ese usuario en la clase: lo salteamos
        // en vez de cortar el resto de la carga masiva.
        skipped.push(`${rawLine} (usuario repetido)`);
      }
    }

    return { added, skipped };
  },

  async getPendingStudents(classroomId: string): Promise<PendingStudent[]> {
    const snap = await getDocs(collection(db, 'classrooms', classroomId, 'estudiantesPendientes'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  },

  async removePendingStudent(classroomId: string, pendingId: string): Promise<void> {
    await deleteDoc(doc(db, 'classrooms', classroomId, 'estudiantesPendientes', pendingId));
  },

  /**
   * Valida usuario + contraseña de un alumno agregado manualmente que todavía
   * no reclamó su cuenta. Requiere estar autenticado (por ej. sesión anónima)
   * antes de llamarlo, ya que la regla de lectura exige `request.auth != null`.
   */
  /**
   * Busca un registro por usuario/contraseña, sin importar mayúsculas en el
   * usuario (los chicos no siempre lo tipean igual que se lo asignaron) y
   * sin filtrar por `claimed` — si ya estaba reclamado, quien llama a esto
   * decide qué hacer (por ejemplo, avisar "ya te uniste antes" en vez de
   * decir "incorrecto", que sería engañoso).
   *
   * Trae todos los pendientes de la clase y compara en memoria en vez de
   * hacer un query por igualdad exacta — para una clase de 30-40 alumnos
   * esto no tiene costo real, y evita depender de un campo extra
   * (usernameLower) que los registros viejos no tendrían.
   */
  async validateManualCredentials(
    classroomId: string,
    username: string,
    password: string
  ): Promise<PendingStudent | null> {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const snap = await getDocs(collection(db, 'classrooms', classroomId, 'estudiantesPendientes'));
    const match = snap.docs.find((d) => {
      const data = d.data() as any;
      const storedUsername = String(data.username ?? '').trim().toLowerCase();
      const storedPassword = String(data.password ?? '').trim();
      return storedUsername === normalizedUsername && storedPassword === normalizedPassword;
    });

    if (!match) return null;
    return { id: match.id, ...(match.data() as any) } as PendingStudent;
  },

  /**
   * Convierte un registro pendiente en un alumno real: crea su doc en
   * `estudiantes/{uid}` y marca el pendiente como reclamado. Guarda el
   * `pendingId` en el alumno para poder ubicar sus credenciales después.
   */
  /**
   * Crea o actualiza el doc del alumno dentro de la clase. Se llama en CADA
   * login (no solo la primera vez) — como ahora el uid del alumno es
   * estable, un "segundo login" no es nada especial, es solo... un login.
   * `claimed`/`claimedUid` en estudiantesPendientes ya los marca el propio
   * endpoint /api/join-class al validar las credenciales.
   */
  async upsertClassroomStudent(
    classroomId: string,
    studentUid: string,
    username: string,
    character: Character
  ): Promise<void> {
    const ref = doc(db, 'classrooms', classroomId, 'estudiantes', studentUid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      // Ya existía: NO tocamos `progress` (ahí vive lo que ya jugó).
      await updateDoc(ref, { username, character, lastLoginAt: serverTimestamp() });
    } else {
      await setDoc(ref, {
        username,
        character,
        joinedAt: serverTimestamp(),
        addedManually: true,
        pendingId: studentUid,
      });
    }
  },

  // ---------- Credenciales (usuario/contraseña de alumnos manuales) ----------

  /**
   * Trae un registro de estudiantesPendientes por id — sirve tanto para un
   * alumno todavía sin reclamar como para uno ya reclamado (el registro no
   * se borra al reclamar, solo se marca `claimed: true`).
   */
  async getPendingStudentById(classroomId: string, pendingId: string): Promise<PendingStudent | null> {
    const snap = await getDoc(doc(db, 'classrooms', classroomId, 'estudiantesPendientes', pendingId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as PendingStudent;
  },

  /**
   * Fallback para alumnos que ya estaban reclamados ANTES de que empezáramos
   * a guardar `pendingId` en su doc de `estudiantes` — los busca por
   * `claimedUid` en vez de por id directo.
   */
  async getPendingStudentByClaimedUid(classroomId: string, uid: string): Promise<PendingStudent | null> {
    const q = query(
      collection(db, 'classrooms', classroomId, 'estudiantesPendientes'),
      where('claimedUid', '==', uid),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as any) } as PendingStudent;
  },

  /**
   * Cambia el usuario y/o la contraseña de un alumno (pendiente o ya
   * reclamado) — para cuando se lo olvida o el docente quiere reasignarlo.
   */
  async updateCredentials(
    classroomId: string,
    pendingId: string,
    updates: { username?: string; password?: string }
  ): Promise<void> {
    await updateDoc(doc(db, 'classrooms', classroomId, 'estudiantesPendientes', pendingId), updates);
  },

  /**
   * Reinicia el acceso de un alumno ya reclamado: borra su registro de
   * `estudiantes` (pierde el progreso guardado bajo ese uid) y vuelve a
   * marcar el pendiente como no reclamado, para que pueda unirse de cero
   * con el mismo usuario/contraseña — típicamente porque perdió el acceso
   * en su dispositivo (borró el navegador, es un dispositivo nuevo, etc.)
   * y no hay otra forma de recuperarlo con el esquema actual de sesión
   * anónima por dispositivo.
   */
  async resetStudentAccess(classroomId: string, pendingId: string, studentUid: string): Promise<void> {
    await deleteDoc(doc(db, 'classrooms', classroomId, 'estudiantes', studentUid));
    await updateDoc(doc(db, 'classrooms', classroomId, 'estudiantesPendientes', pendingId), {
      claimed: false,
      claimedUid: null,
    });
  },

  // ---------- Progreso académico ----------

  /**
   * Actualiza el "resumen de progreso" del alumno dentro de su clase.
   * Usa merge:true para no pisar username/character/joinedAt.
   * Deliberadamente NO incluye historial de estado de ánimo ni respuestas
   * de tests sensibles (salud mental, etc.) — solo avance académico general.
   */
  async syncStudentProgress(
    classroomId: string,
    studentUid: string,
    progress: Omit<StudentProgress, 'completedCount'>
  ): Promise<void> {
    await setDoc(
      doc(db, 'classrooms', classroomId, 'estudiantes', studentUid),
      {
        progress: {
          totalScore: progress.totalScore,
          streak: progress.streak,
          completedCount: progress.completedActivities.length,
          completedActivities: progress.completedActivities,
          activityScores: progress.activityScores,
          lastActive: progress.lastActive,
        },
        progressUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },
};

export default ClassroomService;