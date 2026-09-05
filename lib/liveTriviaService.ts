// lib/liveTriviaService.ts
//
// Requiere las reglas de firestore.rules para `livetrivias/{code}` y sus
// subcolecciones `players`/`answers`. Mismo criterio que
// lib/wordCloudService.ts: los alumnos entran sin cuenta, así que esas
// escrituras se validan por FORMA del dato (no por identidad). El puntaje
// lo calcula el propio cliente que responde (si acertó + qué tan rápido) —
// no hay nada que ganar falseándolo en una trivia de clase.
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
import { generateUniqueJoinCode } from '@/lib/joinCode';
import { sortArrayRandomly } from '@/utils/helpers';
import type { LiveTriviaSession, LiveTriviaPlayer, LiveTriviaAnswer, LiveTriviaQuestion } from '@/types/liveTrivia';
import type { TriviaQuestion } from '@/types/trivia';

// Tope por docente, mismo criterio de uso (no de seguridad) que
// MAX_SESSIONS_PER_TEACHER en wordCloudService.ts.
export const MAX_LIVE_TRIVIA_SESSIONS_PER_TEACHER = 5;

export const QUESTION_DURATION_SECONDS = 20;
const MAX_POINTS_PER_QUESTION = 1000;
const MIN_POINTS_PER_QUESTION = 500;

async function codeExists(code: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'livetrivias', code));
  return snap.exists();
}

// Mezcla las opciones UNA sola vez, al crear la partida — todos los
// jugadores ven el mismo orden durante toda la partida.
function buildLiveQuestions(questions: TriviaQuestion[]): LiveTriviaQuestion[] {
  return questions.map((q) => {
    const options = sortArrayRandomly([q.options.first, q.options.second, q.options.third, q.answer]);
    return {
      question: q.question,
      options,
      correctIndex: options.indexOf(q.answer),
      resume: q.resume,
    };
  });
}

/** Puntos por responder bien: 1000 si contesta al instante, bajando
 *  linealmente hasta 500 al filo del tiempo — mismo espíritu Kahoot. */
export function pointsForAnswer(correct: boolean, elapsedSeconds: number): number {
  if (!correct) return 0;
  const ratio = Math.min(1, Math.max(0, elapsedSeconds / QUESTION_DURATION_SECONDS));
  return Math.round(MAX_POINTS_PER_QUESTION - (MAX_POINTS_PER_QUESTION - MIN_POINTS_PER_QUESTION) * ratio);
}

const LiveTriviaService = {
  async createSession(teacherId: string, triviaId: string): Promise<LiveTriviaSession> {
    const triviaSnap = await getDoc(doc(db, 'trivia', triviaId));
    if (!triviaSnap.exists()) throw new Error('TRIVIA_NOT_FOUND');
    const triviaData = triviaSnap.data() as { name: string; questions: TriviaQuestion[] };
    if (!triviaData.questions || triviaData.questions.length === 0) throw new Error('TRIVIA_EMPTY');

    const code = await generateUniqueJoinCode(codeExists, 5);

    const session: LiveTriviaSession = {
      code,
      teacherId,
      triviaId,
      triviaName: triviaData.name,
      questions: buildLiveQuestions(triviaData.questions),
      phase: 'lobby',
      currentQuestionIndex: 0,
      questionStartedAt: null,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'livetrivias', code), session);
    return session;
  },

  async getSession(code: string): Promise<LiveTriviaSession | null> {
    const snap = await getDoc(doc(db, 'livetrivias', code));
    return snap.exists() ? (snap.data() as LiveTriviaSession) : null;
  },

  async getTeacherSessions(teacherId: string): Promise<LiveTriviaSession[]> {
    const q = query(collection(db, 'livetrivias'), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as LiveTriviaSession)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  subscribeToSession(code: string, callback: (session: LiveTriviaSession | null) => void): Unsubscribe {
    return onSnapshot(doc(db, 'livetrivias', code), (snap) => {
      callback(snap.exists() ? (snap.data() as LiveTriviaSession) : null);
    });
  },

  subscribeToPlayers(code: string, callback: (players: LiveTriviaPlayer[]) => void): Unsubscribe {
    const q = query(collection(db, 'livetrivias', code, 'players'), orderBy('score', 'desc'), limit(200));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LiveTriviaPlayer, 'id'>) })));
    });
  },

  /** Respuestas de la pregunta puntual en curso — para el conteo en vivo
   *  de "cuántos ya respondieron" y la barra de resultados al revelar. */
  subscribeToAnswersForQuestion(
    code: string,
    questionIndex: number,
    callback: (answers: LiveTriviaAnswer[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'livetrivias', code, 'answers'),
      where('questionIndex', '==', questionIndex)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LiveTriviaAnswer, 'id'>) })));
    });
  },

  async joinSession(code: string, name: string): Promise<string> {
    const playerId = doc(collection(db, 'livetrivias', code, 'players')).id;
    await setDoc(doc(db, 'livetrivias', code, 'players', playerId), {
      name: name.trim().slice(0, 30),
      score: 0,
      joinedAt: new Date().toISOString(),
    });
    return playerId;
  },

  /** Un `create` sobre `answers/{playerId}_{questionIndex}` — la regla
   *  solo permite crear (no actualizar), así que un segundo intento sobre
   *  la misma pregunta se rechaza solo: no se puede cambiar la respuesta. */
  async submitAnswer(
    code: string,
    playerId: string,
    questionIndex: number,
    optionIndex: number,
    correct: boolean,
    pointsEarned: number
  ): Promise<void> {
    const answerId = `${playerId}_${questionIndex}`;
    await setDoc(doc(db, 'livetrivias', code, 'answers', answerId), {
      playerId,
      questionIndex,
      optionIndex,
      correct,
      pointsEarned,
      answeredAt: new Date().toISOString(),
    });
    if (pointsEarned > 0) {
      await updateDoc(doc(db, 'livetrivias', code, 'players', playerId), {
        score: increment(pointsEarned),
      });
    }
  },

  async getMyAnswerForQuestion(code: string, playerId: string, questionIndex: number): Promise<LiveTriviaAnswer | null> {
    const snap = await getDoc(doc(db, 'livetrivias', code, 'answers', `${playerId}_${questionIndex}`));
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<LiveTriviaAnswer, 'id'>) }) : null;
  },

  // ---------- Controles del docente (avanzan la partida) ----------

  async startGame(code: string): Promise<void> {
    await updateDoc(doc(db, 'livetrivias', code), {
      phase: 'question',
      currentQuestionIndex: 0,
      questionStartedAt: new Date().toISOString(),
    });
  },

  async revealAnswer(code: string): Promise<void> {
    await updateDoc(doc(db, 'livetrivias', code), { phase: 'reveal' });
  },

  async showLeaderboard(code: string): Promise<void> {
    await updateDoc(doc(db, 'livetrivias', code), { phase: 'leaderboard' });
  },

  async nextQuestion(code: string, nextIndex: number): Promise<void> {
    await updateDoc(doc(db, 'livetrivias', code), {
      phase: 'question',
      currentQuestionIndex: nextIndex,
      questionStartedAt: new Date().toISOString(),
    });
  },

  async endGame(code: string): Promise<void> {
    await updateDoc(doc(db, 'livetrivias', code), { phase: 'finished' });
  },

  // Firestore no borra subcolecciones solas al borrar el documento padre —
  // hay que borrar cada jugador/respuesta a mano primero.
  async deleteSession(code: string): Promise<void> {
    const [playersSnap, answersSnap] = await Promise.all([
      getDocs(collection(db, 'livetrivias', code, 'players')),
      getDocs(collection(db, 'livetrivias', code, 'answers')),
    ]);
    await Promise.all([
      ...playersSnap.docs.map((d) => deleteDoc(d.ref)),
      ...answersSnap.docs.map((d) => deleteDoc(d.ref)),
    ]);
    await deleteDoc(doc(db, 'livetrivias', code));
  },
};

export default LiveTriviaService;
