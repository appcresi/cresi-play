// lib/modelClassroom.ts
//
// "Clase modelo": la primera vez que un docente entra a su panel le
// armamos una clase de ejemplo con una tarea por cada tipo de adjunto que
// ofrece CreateTareaScreen (trivia, buscador, infografía, BioPuzzle,
// Completa Palabras, Nube de Palabras, actividad del catálogo, recurso y
// consigna libre) — así ve todo lo que puede hacer en una clase sin
// tener que descubrirlo solo. Es una clase normal: la puede editar, usar
// con alumnos reales o borrar.
//
// Se siembra UNA sola vez por docente: al terminar se marca
// `users/{uid}.modelClassroomSeeded`, así si la borra no reaparece. Los
// ids son fijos (`modelo-{uid}` para la clase, `modelo-NN` para las
// tareas) para que un reintento después de un fallo a mitad de camino —
// o dos pestañas abiertas a la vez — pise los mismos documentos en vez de
// duplicarlos.
import { db } from '@/lib/firebaseFirestore';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { generateUniqueJoinCode } from '@/lib/joinCode';
import { CLASSROOM_COLORS } from '@/lib/classroomService';
import WordCloudService from '@/lib/wordCloudService';
import ResourceService from '@/lib/resourceService';
import { getActivityById } from '@/lib/activities';
import { bodySystems } from '@/app/(routes)/biopuzzle/data/bodySystems';
import type { LinkedActivity } from '@/types/tarea';

export const MODEL_CLASSROOM_NAME = 'Clase modelo · Explorá CrESI Play';
const MODEL_CLASSROOM_COLOR = CLASSROOM_COLORS[13];
const NUBE_SUGERIDA ='¿Qué palabra se te viene a la cabeza cuando pensás en ESI?';
const DAY_MS = 24 * 60 * 60 * 1000;

export function modelClassroomIdFor(teacherId: string): string {
  return `modelo-${teacherId}`;
}

export function isModelClassroom(classroomId: string, teacherId: string): boolean {
  return classroomId === modelClassroomIdFor(teacherId);
}

interface ModelTarea {
  title: string;
  consigna: string;
  linkedActivity: LinkedActivity;
  points: number;
  /** Días desde hoy hasta la fecha de entrega. */
  dueInDays: number;
}

async function firstCresiItem(
  collectionName: 'trivia' | 'infografias' | 'completapalabras',
  labelField: 'name' | 'title'
): Promise<{ id: string; label: string } | null> {
  const snap = await getDocs(
    query(collection(db, collectionName), where('author', '==', 'CRESI'), limit(1))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, label: d.data()[labelField] ?? '' };
}

/** Liga una nube que el docente YA tenga. No creamos una nueva: las nubes
 *  tienen tope por docente (MAX_SESSIONS_PER_TEACHER) y la clase modelo
 *  no debería gastarle un lugar sin que lo pida. */
async function existingNube(teacherId: string): Promise<{ id: string; label: string } | null> {
  const sessions = await WordCloudService.getTeacherSessions(teacherId);
  const nube = sessions.find((s) => s.active) ?? sessions[0];
  return nube ? { id: nube.code, label: nube.title || 'Sin consigna' } : null;
}

async function buildTareas(teacherId: string): Promise<ModelTarea[]> {
  // Cada catálogo se consulta por separado y un fallo en uno solo hace que
  // se saltee esa tarea, no toda la clase modelo.
  const safe = <T,>(p: Promise<T>) => p.catch((err) => {
    console.error('Clase modelo: no se pudo cargar un catálogo', err);
    return null;
  });
  const [trivia, infografia, completa, nube, recursos] = await Promise.all([
    safe(firstCresiItem('trivia', 'name')),
    safe(firstCresiItem('infografias', 'title')),
    safe(firstCresiItem('completapalabras', 'title')),
    safe(existingNube(teacherId)),
    safe(ResourceService.getAll()),
  ]);
  const recurso = recursos?.find((r) => r.is_free) ?? recursos?.[0] ?? null;
  const bio = bodySystems[0];
  const simulador = getActivityById('simulador') ?? null;

  const tareas: (ModelTarea | null)[] = [
    {
      title: 'Bienvenida: así funciona esta clase modelo',
      consigna:
        'Esta clase la armamos para que veas todo lo que podés hacer en CrESI Play. Cada tarea muestra un tipo de recurso distinto que podés adjuntar:\n\n' +
        '• Trivia · Buscador · Infografía · BioPuzzle · Completa Palabras · Nube de Palabras · Actividades del catálogo · Recursos descargables · Consigna libre (como esta).\n\n' +
        'Probá también:\n' +
        '• "Trabajo en clase": elegí qué actividades, trivias, preguntas e infografías ven tus alumnos.\n' +
        '• "Personas": agregá alumnos con usuario y contraseña, uno por uno o en lote.\n' +
        '• "Calificaciones": el cuaderno con todas las entregas y notas.\n' +
        '• Desde el menú superior: Trivia en vivo (estilo Kahoot) y tus propias trivias y lecciones.\n\n' +
        'Podés editar o borrar cualquier tarea, usar esta clase con alumnos reales, o eliminarla cuando ya no la necesites.',
      linkedActivity: { type: 'libre' },
      points: 0,
      dueInDays: 30,
    },
    trivia && {
      title: 'Trivia: poné a prueba lo que sabés',
      consigna:
        'Jugá la trivia y, al terminar, contá en una oración cuál fue la pregunta que más te sorprendió y por qué.\n\n' +
        '(Docente: podés ligar trivias de CrESI o las que crees vos desde "Mis trivias".)',
      linkedActivity: { type: 'trivia', id: trivia.id, label: trivia.label },
      points: 100,
      dueInDays: 7,
    },
    {
      title: 'Buscador: investigá un término',
      consigna:
        'Usá el buscador para encontrar la definición de "consentimiento". Escribí con tus palabras qué significa y un ejemplo de la vida cotidiana.',
      linkedActivity: { type: 'buscador' },
      points: 50,
      dueInDays: 8,
    },
    infografia && {
      title: 'Infografía: leer y resumir',
      consigna: 'Mirá la infografía con atención y anotá las tres ideas principales que te llevás.',
      linkedActivity: { type: 'infografia', id: infografia.id, label: infografia.label },
      points: 50,
      dueInDays: 9,
    },
    bio && {
      title: 'BioPuzzle: armá el cuerpo humano',
      consigna:
        'Resolvé el desafío de BioPuzzle ubicando cada órgano en su lugar. Cuando termines, marcá la tarea como hecha.\n\n' +
        '(Docente: también podés dejarlo en "Cualquiera" para que cada alumno elija el sistema.)',
      linkedActivity: { type: 'biopuzzle', id: bio.id, label: bio.name },
      points: 50,
      dueInDays: 10,
    },
    completa && {
      title: 'Completa Palabras: completá los conceptos',
      consigna:
        'Completá las frases arrastrando las palabras correctas.\n\n' +
        '(Docente: podés crear tus propias lecciones desde "Completa Palabras" en el menú.)',
      linkedActivity: { type: 'completapalabras', id: completa.id, label: completa.label },
      points: 50,
      dueInDays: 11,
    },
    nube
      ? {
          title: 'Nube de Palabras: lluvia de ideas',
          consigna:
            'Entrá a la nube y mandá una palabra. Todas las respuestas aparecen en vivo, de forma anónima.\n\n' +
            '(Docente: proyectá la nube en el aula desde "Nube de Palabras" para verla crecer en tiempo real.)',
          linkedActivity: { type: 'nube', id: nube.id, label: nube.label },
          points: 10,
          dueInDays: 12,
        }
      : {
          title: 'Nube de Palabras: lluvia de ideas',
          consigna:
            `Consigna sugerida: "${NUBE_SUGERIDA}". Cada alumno manda una palabra y la nube se arma en vivo, de forma anónima.\n\n` +
            '(Docente: creá tu nube desde "Nube de Palabras" en el menú, proyectala en el aula y después editá esta tarea para adjuntarla.)',
          linkedActivity: { type: 'libre' },
          points: 10,
          dueInDays: 12,
        },
    simulador && {
      title: 'Actividad del catálogo: Simulador Grooming',
      consigna:
        'Jugá el simulador y respondé: ¿qué señales te hicieron sospechar de la conversación? ¿Qué harías si te pasara de verdad?',
      linkedActivity: { type: 'actividad', id: simulador.id, label: simulador.title },
      points: 100,
      dueInDays: 13,
    },
    recurso && {
      title: 'Recurso: material para descargar',
      consigna:
        'Descargá el material adjunto y leelo antes de la próxima clase.\n\n' +
        '(Docente: los recursos son guías y talleres de CrESI que podés compartir con tu curso.)',
      linkedActivity: { type: 'recurso', id: recurso.id, label: recurso.title },
      points: 0,
      dueInDays: 14,
    },
    {
      title: 'Consigna libre: reflexión personal',
      consigna:
        'Sin actividad adjunta: el alumno responde con texto. Escribí un párrafo sobre qué tema de ESI te gustaría trabajar este año y por qué.',
      linkedActivity: { type: 'libre' },
      points: 20,
      dueInDays: 15,
    },
  ];
  return tareas.filter((t): t is ModelTarea => !!t);
}

async function classroomCodeExists(code: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, 'classrooms'), where('code', '==', code), limit(1)));
  return !snap.empty;
}

let inFlight: Promise<boolean> | null = null;

/**
 * Crea la clase modelo si este docente todavía no la tuvo nunca.
 * Devuelve true si la creó ahora (para recargar el listado de clases).
 */
export function ensureModelClassroom(teacherId: string): Promise<boolean> {
  if (!inFlight) {
    inFlight = seed(teacherId).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function seed(teacherId: string): Promise<boolean> {
  const userRef = doc(db, 'users', teacherId);
  const userSnap = await getDoc(userRef);
  if (userSnap.data()?.modelClassroomSeeded) return false;

  const classroomRef = doc(db, 'classrooms', modelClassroomIdFor(teacherId));
  const existing = await getDoc(classroomRef);
  if (!existing.exists()) {
    await setDoc(classroomRef, {
      name: MODEL_CLASSROOM_NAME,
      profesorId: teacherId,
      code: await generateUniqueJoinCode(classroomCodeExists, 6),
      allowedActivities: null,
      visibleTrivias: null,
      visibleCompletaPalabras: null,
      restrictedTags: null,
      restrictedQuestionIds: null,
      restrictedInfografias: null,
      allowGoogleSignIn: false,
      color: MODEL_CLASSROOM_COLOR,
      isModel: true,
      createdAt: serverTimestamp(),
    });
  }

  const tareas = await buildTareas(teacherId);
  const now = Date.now();
  await Promise.all(
    tareas.map((t, i) =>
      setDoc(doc(classroomRef, 'tareas', `modelo-${String(i + 1).padStart(2, '0')}`), {
        title: t.title,
        consigna: t.consigna,
        linkedActivity: t.linkedActivity,
        points: t.points,
        dueDate: new Date(now + t.dueInDays * DAY_MS).toISOString(),
        createdBy: teacherId,
        // El Tablón ordena por createdAt (más nueva arriba): escalonamos
        // para que la bienvenida quede primera y el resto siga el orden.
        createdAt: Timestamp.fromMillis(now - i * 1000),
        updatedAt: serverTimestamp(),
      })
    )
  );

  await setDoc(userRef, { modelClassroomSeeded: true }, { merge: true });
  return true;
}
