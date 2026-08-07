import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface BankQuestion {
  id: string;
  question: string;
  answer: string;
  resume: string;
  category: string;
  tag: string;
  level: number;
}

let cachedQuestions: BankQuestion[] | null = null;
let inFlightFetch: Promise<BankQuestion[]> | null = null;

/**
 * Trae las ~1000 preguntas de la colección `questions`, una sola vez por
 * sesión (se guardan en memoria — recargar la página vuelve a pedirlas,
 * pero navegar entre pantallas dentro de la misma sesión no).
 */
export async function loadQuestionBank(): Promise<BankQuestion[]> {
  if (cachedQuestions) return cachedQuestions;
  if (inFlightFetch) return inFlightFetch;

  inFlightFetch = (async () => {
    const snap = await getDocs(collection(db, 'questions'));
    const questions: BankQuestion[] = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id ?? doc.id,
        question: data.question ?? '',
        answer: data.answer ?? '',
        resume: data.resume ?? '',
        category: data.category ?? '',
        tag: data.tag ?? '',
        level: typeof data.level === 'number' ? data.level : Number(data.level) || 1,
      };
    });
    cachedQuestions = questions;
    inFlightFetch = null;
    return questions;
  })();

  return inFlightFetch;
}

/** Saca tildes para poder comparar "prevencion" con "Prevención". */
function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const MIN_QUERY_LENGTH = 3;

/** Escapa caracteres especiales de regex, ya que el término lo escribe la persona. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** true si ALGUNA palabra del texto empieza con el término buscado. */
function matchesWordStart(text: string, normalizedQuery: string): boolean {
  const normalizedText = normalizeForSearch(text);
  const regex = new RegExp(`\\b${escapeRegExp(normalizedQuery)}`);
  return regex.test(normalizedText);
}

/**
 * Filtra las preguntas cuyo texto (pregunta, respuesta o explicación)
 * tenga alguna PALABRA que empiece con el término buscado — no cualquier
 * coincidencia en cualquier parte (así buscar "ano" no trae "órganos",
 * que solo lo contiene en el medio). Ordena los resultados por dónde
 * apareció la coincidencia: primero pregunta, después respuesta, por
 * último "más información". Ignora tildes y mayúsculas/minúsculas. No
 * busca nada hasta la tercera letra escrita.
 */
export function searchQuestions(questions: BankQuestion[], query: string): BankQuestion[] {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const normalizedQuery = normalizeForSearch(trimmed);

  // 1 = coincide en la pregunta, 2 = en la respuesta, 3 = solo en el
  // resumen. `null` = no coincide en ningún lado (se descarta).
  const matchRank = (q: BankQuestion): 1 | 2 | 3 | null => {
    if (matchesWordStart(q.question, normalizedQuery)) return 1;
    if (matchesWordStart(q.answer, normalizedQuery)) return 2;
    if (matchesWordStart(q.resume, normalizedQuery)) return 3;
    return null;
  };

  return questions
    .map((q) => ({ q, rank: matchRank(q) }))
    .filter((entry): entry is { q: BankQuestion; rank: 1 | 2 | 3 } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.q);
}

/**
 * Saca las preguntas que el docente de la clase restringió — por
 * etiqueta completa, o puntualmente por ID. Si no hay restricciones
 * (classroom sin restrictedTags/restrictedQuestionIds, o alumno sin
 * clase), devuelve todas las preguntas sin tocar.
 */
export function filterByClassroomRestrictions(
  questions: BankQuestion[],
  restrictedTags: string[] | null | undefined,
  restrictedQuestionIds: string[] | null | undefined
): BankQuestion[] {
  const tagsBlocked = restrictedTags && restrictedTags.length > 0 ? new Set(restrictedTags) : null;
  const idsBlocked = restrictedQuestionIds && restrictedQuestionIds.length > 0 ? new Set(restrictedQuestionIds) : null;

  if (!tagsBlocked && !idsBlocked) return questions;

  return questions.filter((q) => {
    if (tagsBlocked && tagsBlocked.has(q.tag)) return false;
    if (idsBlocked && idsBlocked.has(q.id)) return false;
    return true;
  });
}

/** Lista de etiquetas distintas presentes en el banco, ordenada alfabéticamente. */
export function getDistinctTags(questions: BankQuestion[]): string[] {
  return Array.from(new Set(questions.map((q) => q.tag).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'es')
  );
}