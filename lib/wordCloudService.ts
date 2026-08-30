// lib/wordCloudService.ts
//
// Requiere las reglas de firestore.rules para `wordclouds/{code}` y su
// subcolección `words/{wordId}`. A diferencia de todo lo demás en este
// archivo de reglas, escribir una palabra NO requiere estar logueado — los
// alumnos entran sin cuenta, así que esa escritura se valida por FORMA del
// dato (texto corto, contador positivo) en vez de por identidad. No hay
// incentivo real para falsear esto (a nadie le sirve inflar una nube de
// palabras de otro), mismo criterio que ya se usó para `playCount` y
// `questionStats` en trivia.
import { db } from '@/lib/firebaseFirestore';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import type { WordCloudSession, WordCloudEntry } from '@/types/wordcloud';

// Tope por docente — se valida del lado del cliente en la pantalla de
// creación (contando `getTeacherSessions`), no en las reglas de Firestore:
// no hay forma de contar documentos existentes desde una security rule sin
// una Cloud Function, y esto es un límite de uso (evitar que se acumulen
// nubes viejas), no un control de seguridad. Nada grave si alguien lo
// esquiva a mano.
export const MAX_SESSIONS_PER_TEACHER = 5;

// Evitamos caracteres confusos: 0/O, 1/I — mismo alfabeto que usa
// classroomService.ts para los códigos de clase.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(length = 5): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function codeExists(code: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'wordclouds', code));
  return snap.exists();
}

// El id del documento de cada palabra tiene que ser el texto NORMALIZADO
// (minúscula + sin espacios de más) para que dos alumnos que mandan "amor"
// y "Amor" sumen al mismo conteo en vez de crear dos entradas separadas.
// `encodeURIComponent` deja el resultado seguro como id de Firestore (nunca
// mete "/", que es el único carácter realmente prohibido) sin tener que
// lidiar a mano con acentos o la "ñ".
function wordIdFor(normalizedText: string): string {
  return encodeURIComponent(normalizedText).slice(0, 300);
}

function normalize(rawText: string): string {
  return rawText.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 30);
}

const WordCloudService = {
  async createSession(teacherId: string, title: string): Promise<WordCloudSession> {
    let code = generateCode();
    for (let attempt = 0; attempt < 5 && (await codeExists(code)); attempt++) {
      code = generateCode();
    }

    const session: WordCloudSession = {
      code,
      title: title.trim(),
      teacherId,
      active: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'wordclouds', code), session);
    return session;
  },

  async getSession(code: string): Promise<WordCloudSession | null> {
    const snap = await getDoc(doc(db, 'wordclouds', code));
    return snap.exists() ? (snap.data() as WordCloudSession) : null;
  },

  async getTeacherSessions(teacherId: string): Promise<WordCloudSession[]> {
    const q = query(collection(db, 'wordclouds'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as WordCloudSession)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  subscribeToSession(code: string, callback: (session: WordCloudSession | null) => void): Unsubscribe {
    return onSnapshot(doc(db, 'wordclouds', code), (snap) => {
      callback(snap.exists() ? (snap.data() as WordCloudSession) : null);
    });
  },

  subscribeToWords(code: string, callback: (words: WordCloudEntry[]) => void): Unsubscribe {
    const q = query(collection(db, 'wordclouds', code, 'words'), orderBy('count', 'desc'), limit(150));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WordCloudEntry, 'id'>) })));
    });
  },

  // Suma 1 al contador de la palabra (o la crea en 1 si es la primera vez
  // que aparece en esta nube). `setDoc` con `merge` + `increment` evita la
  // carrera de "leer el valor, sumarle 1, guardar" cuando dos alumnos
  // mandan la misma palabra al mismo tiempo.
  async submitWord(code: string, rawText: string): Promise<void> {
    const normalized = normalize(rawText);
    if (!normalized) return;

    const wordRef = doc(db, 'wordclouds', code, 'words', wordIdFor(normalized));
    await setDoc(
      wordRef,
      { text: normalized, count: increment(1), updatedAt: new Date().toISOString() },
      { merge: true }
    );
  },

  async deleteWord(code: string, wordId: string): Promise<void> {
    await deleteDoc(doc(db, 'wordclouds', code, 'words', wordId));
  },

  async endSession(code: string): Promise<void> {
    await updateDoc(doc(db, 'wordclouds', code), { active: false });
  },

  async reopenSession(code: string): Promise<void> {
    await updateDoc(doc(db, 'wordclouds', code), { active: true });
  },

  // Firestore no borra subcolecciones solas al borrar el documento padre —
  // hay que borrar cada palabra a mano primero. El orden importa: se borran
  // las palabras ANTES que la sesión porque la regla de borrado de cada
  // palabra valida el dueño leyendo `teacherId` del documento padre (si se
  // borrara la sesión primero, ese `get()` ya no encontraría nada).
  async deleteSession(code: string): Promise<void> {
    const wordsSnap = await getDocs(collection(db, 'wordclouds', code, 'words'));
    await Promise.all(wordsSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'wordclouds', code));
  },
};

export default WordCloudService;
