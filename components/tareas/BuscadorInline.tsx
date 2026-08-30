'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IconSearch, IconChevronDown, IconInfoCircle, IconTag, IconCopy, IconCheck } from '@tabler/icons-react';
import { Disclosure, Transition } from '@headlessui/react';
import {
  loadQuestionBank,
  searchQuestions,
  filterByClassroomRestrictions,
  MIN_QUERY_LENGTH,
  type BankQuestion,
} from '@/lib/questionSearch';
import UserDataManager from '@/lib/userDataManager';
import ClassroomService from '@/lib/classroomService';

const ACCENT = '#4F46E5';
const ACTIVITY_TITLE = 'Buscador de Preguntas';
const POINTS_PER_SEARCH = 10;
const POINTS_PER_COPY = 5;
const POINTS_PER_INFO_VIEW = 5;
const SEARCH_COMMIT_DELAY_MS = 1000;

/**
 * Versión embebida del Buscador de Preguntas, para usar dentro de una
 * tarea sin mandar al alumno a otra página — mismo motor de búsqueda y
 * mismo banco de preguntas que /buscador, nada más que sin el encabezado
 * de página completa. `awardPoints` queda en false por default (usado
 * también desde la vista del docente, donde no corresponde puntuar).
 *
 * `onComplete` (si viene) se dispara la primera vez que el alumno hace una
 * búsqueda válida — TareaViewScreen lo usa para exigir haber usado el
 * buscador antes de poder entregar la tarea.
 */
export const BuscadorInline = ({
  classroomId,
  awardPoints = false,
  onComplete,
}: {
  classroomId?: string;
  awardPoints?: boolean;
  onComplete?: () => void;
}) => {
  const [allQuestions, setAllQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [restrictedTags, setRestrictedTags] = useState<string[] | null | undefined>(undefined);
  const [restrictedQuestionIds, setRestrictedQuestionIds] = useState<string[] | null | undefined>(undefined);

  const lastCommittedSearch = useRef<string>('');
  const commitTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const copiedIds = useRef<Set<string>>(new Set());
  const infoViewedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadQuestionBank()
      .then(setAllQuestions)
      .finally(() => setLoading(false));

    if (classroomId) {
      ClassroomService.getClassroomById(classroomId)
        .then((classroom) => {
          setRestrictedTags(classroom?.restrictedTags ?? null);
          setRestrictedQuestionIds(classroom?.restrictedQuestionIds ?? null);
        })
        .catch(() => {
          setRestrictedTags(null);
          setRestrictedQuestionIds(null);
        });
    } else {
      setRestrictedTags(null);
      setRestrictedQuestionIds(null);
    }
  }, [classroomId]);

  // Independiente de `awardPoints`: avisa apenas hay una búsqueda válida,
  // sin esperar el debounce de puntos (que es solo para no puntuar cada tecla).
  useEffect(() => {
    if (query.trim().length >= MIN_QUERY_LENGTH) onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (!awardPoints) return;
    const trimmed = query.trim();

    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    if (trimmed.length < MIN_QUERY_LENGTH || trimmed === lastCommittedSearch.current) return;

    commitTimerRef.current = setTimeout(() => {
      lastCommittedSearch.current = trimmed;
      const current = UserDataManager.loadUserData();
      UserDataManager.saveUserData({
        ...current,
        game: { ...current.game, totalScore: current.game.totalScore + POINTS_PER_SEARCH },
        progress: {
          ...current.progress,
          activityScores: {
            ...current.progress.activityScores,
            [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + POINTS_PER_SEARCH,
          },
          activityTimes: { ...current.progress.activityTimes, [ACTIVITY_TITLE]: new Date().toISOString() },
        },
        searchHistory: [...(current.searchHistory || []), { term: trimmed, date: new Date().toISOString() }].slice(-200),
      });
    }, SEARCH_COMMIT_DELAY_MS);

    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    };
  }, [query, awardPoints]);

  const awardExtra = (points: number) => {
    if (!awardPoints) return;
    const current = UserDataManager.loadUserData();
    UserDataManager.saveUserData({
      ...current,
      game: { ...current.game, totalScore: current.game.totalScore + points },
      progress: {
        ...current.progress,
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + points,
        },
      },
    });
  };

  const handleCopy = (question: BankQuestion) => {
    if (!copiedIds.current.has(question.id)) {
      copiedIds.current.add(question.id);
      awardExtra(POINTS_PER_COPY);
    }
  };

  const handleViewInfo = (question: BankQuestion) => {
    if (!infoViewedIds.current.has(question.id)) {
      infoViewedIds.current.add(question.id);
      awardExtra(POINTS_PER_INFO_VIEW);
    }
  };

  const restrictionsResolved = restrictedTags !== undefined && restrictedQuestionIds !== undefined;
  const visibleQuestions = restrictionsResolved
    ? filterByClassroomRestrictions(allQuestions, restrictedTags, restrictedQuestionIds)
    : allQuestions;

  const results = searchQuestions(visibleQuestions, query);
  const trimmedQuery = query.trim();

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
          <IconSearch size={18} style={{ color: ACCENT }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink dark:text-gray-100">Buscador de Preguntas</h3>
          <p className="text-xs text-ink/50 dark:text-gray-400">Escribí una palabra clave para buscar en el banco de preguntas.</p>
        </div>
      </div>

      <div className="relative mb-3">
        <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30 dark:text-gray-500" size={17} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por palabra clave..."
          className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-gray-800 dark:text-gray-100 border border-pink-light dark:border-gray-700 rounded-xl text-sm
                   focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
        />
      </div>

      {(loading || !restrictionsResolved) && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: ACCENT }} />
        </div>
      )}

      {!loading && restrictionsResolved && trimmedQuery.length < MIN_QUERY_LENGTH && (
        <p className="text-center text-sm text-ink/40 dark:text-gray-500 py-6">
          {trimmedQuery.length === 0
            ? `Escribí una palabra para buscar entre ${visibleQuestions.length} preguntas.`
            : `Escribí al menos ${MIN_QUERY_LENGTH} letras para buscar.`}
        </p>
      )}

      {!loading && restrictionsResolved && trimmedQuery.length >= MIN_QUERY_LENGTH && (
        <>
          <p className="text-xs text-ink/50 dark:text-gray-400 mb-3">
            {results.length > 0
              ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${trimmedQuery}"`
              : `No se encontraron resultados para "${trimmedQuery}"`}
          </p>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {results.map((q) => (
              <QuestionResultCard key={q.id} question={q} onCopy={() => handleCopy(q)} onViewInfo={() => handleViewInfo(q)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function QuestionResultCard({
  question,
  onCopy,
  onViewInfo,
}: {
  question: BankQuestion;
  onCopy: () => void;
  onViewInfo: () => void;
}): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = async () => {
    const text = `Pregunta: ${question.question}\nRespuesta: ${question.answer}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className="bg-cream dark:bg-gray-900/40 rounded-xl border border-pink-light dark:border-gray-700 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full shrink-0"
            style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
          >
            <IconTag size={11} />
            {question.tag}
          </span>
          <span className="text-[11px] text-ink/40 dark:text-gray-500 truncate">{question.category}</span>
        </div>

        <button
          type="button"
          onClick={handleCopyClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors shrink-0"
          style={{ backgroundColor: copied ? '#DCFCE7' : `${ACCENT}15`, color: copied ? '#16A34A' : ACCENT }}
          title="Copiar pregunta y respuesta"
        >
          {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <p className="text-sm font-medium text-ink dark:text-gray-100 mb-2">{question.question}</p>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-1">
        <p className="text-[11px] font-medium text-ink/50 dark:text-gray-400 mb-1">Respuesta</p>
        <p className="text-sm text-ink/80 dark:text-gray-300">{question.answer}</p>
      </div>

      {question.resume && (
        <Disclosure>
          {({ open }) => (
            <div>
              <Disclosure.Button
                onClick={() => {
                  if (!open) onViewInfo();
                }}
                className="w-full flex items-center justify-between text-xs font-medium text-ink/50 dark:text-gray-400 hover:text-ink/80 dark:hover:text-gray-200 py-1.5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <IconInfoCircle size={14} />
                  Más información
                </span>
                <IconChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
              </Disclosure.Button>
              <Transition
                enter="transition duration-150 ease-out"
                enterFrom="opacity-0 -translate-y-1"
                enterTo="opacity-100 translate-y-0"
              >
                <Disclosure.Panel className="text-xs text-ink/60 dark:text-gray-400 leading-relaxed pt-1 pb-1">
                  {question.resume}
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      )}
    </div>
  );
}
