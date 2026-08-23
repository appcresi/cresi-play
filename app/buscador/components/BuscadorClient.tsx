"use client";

import { useEffect, useRef, useState } from "react";
import { IconSearch, IconChevronDown, IconInfoCircle, IconTag, IconCopy, IconCheck } from "@tabler/icons-react";
import { Disclosure, Transition } from "@headlessui/react";
import {
  loadQuestionBank,
  searchQuestions,
  filterByClassroomRestrictions,
  MIN_QUERY_LENGTH,
  type BankQuestion,
} from "@/lib/questionSearch";
import GameStatusBar from "@/components/GameStatusBar";
import UserDataManager from "@/lib/userDataManager";
import ClassroomService from "@/lib/classroomService";

const ACCENT = "#4F46E5"; // indigo — no pertenece a ninguna actividad puntual del catálogo
const ACTIVITY_TITLE = "Buscador de Preguntas";
const POINTS_PER_SEARCH = 10;
const POINTS_PER_COPY = 5;
const POINTS_PER_INFO_VIEW = 5;
const SEARCH_COMMIT_DELAY_MS = 1000;

export default function BuscadorClient(): JSX.Element {
  const [allQuestions, setAllQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  // Restricciones de la clase, si el alumno entró con código. `undefined`
  // = todavía no se resolvió (para no mostrar de más mientras carga);
  // `null` = sin clase o sin restricción.
  const [restrictedTags, setRestrictedTags] = useState<string[] | null | undefined>(undefined);
  const [restrictedQuestionIds, setRestrictedQuestionIds] = useState<string[] | null | undefined>(undefined);

  const lastCommittedSearch = useRef<string>("");
  const commitTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const copiedIds = useRef<Set<string>>(new Set());
  const infoViewedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadQuestionBank()
      .then(setAllQuestions)
      .finally(() => setLoading(false));

    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    UserDataManager.visitActivity(ACTIVITY_TITLE);

    // Si el alumno entró con código, traemos qué restringió su docente.
    const classroomId = data.profile.classroomId;
    if (classroomId) {
      ClassroomService.getClassroomById(classroomId)
        .then((classroom) => {
          setRestrictedTags(classroom?.restrictedTags ?? null);
          setRestrictedQuestionIds(classroom?.restrictedQuestionIds ?? null);
        })
        .catch((err) => {
          console.error('Error obteniendo restricciones de preguntas:', err);
          setRestrictedTags(null);
          setRestrictedQuestionIds(null);
        });
    } else {
      setRestrictedTags(null);
      setRestrictedQuestionIds(null);
    }
  }, []);

  // Registra la búsqueda como "completada" recién cuando la persona deja
  // de tipear un rato.
  useEffect(() => {
    const trimmed = query.trim();

    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }

    if (trimmed.length < MIN_QUERY_LENGTH || trimmed === lastCommittedSearch.current) {
      return;
    }

    commitTimerRef.current = setTimeout(() => {
      lastCommittedSearch.current = trimmed;

      const current = UserDataManager.loadUserData();
      const updatedData = {
        ...current,
        game: {
          ...current.game,
          totalScore: current.game.totalScore + POINTS_PER_SEARCH,
        },
        progress: {
          ...current.progress,
          activityScores: {
            ...current.progress.activityScores,
            [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + POINTS_PER_SEARCH,
          },
          activityTimes: {
            ...current.progress.activityTimes,
            [ACTIVITY_TITLE]: new Date().toISOString(),
          },
        },
        searchHistory: [
          ...(current.searchHistory || []),
          { term: trimmed, date: new Date().toISOString() },
        ].slice(-200),
      };

      UserDataManager.saveUserData(updatedData);
      setScore(updatedData.game.totalScore);
    }, SEARCH_COMMIT_DELAY_MS);

    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    };
  }, [query]);

  const awardPoints = (points: number) => {
    const current = UserDataManager.loadUserData();
    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + points,
      },
      progress: {
        ...current.progress,
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + points,
        },
      },
    };
    UserDataManager.saveUserData(updatedData);
    setScore(updatedData.game.totalScore);
  };

  const handleCopy = (question: BankQuestion) => {
    if (!copiedIds.current.has(question.id)) {
      copiedIds.current.add(question.id);
      awardPoints(POINTS_PER_COPY);
    }
  };

  const handleViewInfo = (question: BankQuestion) => {
    if (!infoViewedIds.current.has(question.id)) {
      infoViewedIds.current.add(question.id);
      awardPoints(POINTS_PER_INFO_VIEW);
    }
  };

  const restrictionsResolved = restrictedTags !== undefined && restrictedQuestionIds !== undefined;
  const isRestricted = Boolean(
    (restrictedTags && restrictedTags.length > 0) || (restrictedQuestionIds && restrictedQuestionIds.length > 0)
  );

  const visibleQuestions = restrictionsResolved
    ? filterByClassroomRestrictions(allQuestions, restrictedTags, restrictedQuestionIds)
    : allQuestions;

  const results = searchQuestions(visibleQuestions, query);
  const trimmedQuery = query.trim();

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900">
      <GameStatusBar title="Buscador de Preguntas" score={score} lives={lives} level={1} />

      <section className="w-full max-w-4xl mx-auto px-4 pt-24 pb-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
          <div className="h-20 md:h-24 relative" style={{ background: `linear-gradient(to right, ${ACCENT}, ${ACCENT}CC)` }}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-20"></div>
          </div>
          <div className="px-6 py-6">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Buscador de preguntas
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Buscá entre nuestro banco de preguntas sobre ESI — escribí una palabra y encontrá todo lo relacionado. +{POINTS_PER_SEARCH} puntos por cada búsqueda.
            </p>
            {isRestricted && (
              <p className="text-xs text-amber-600 mt-2">
                Tu docente restringió algunas preguntas para esta clase.
              </p>
            )}
          </div>
        </div>

        <div className="relative mb-6">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por palabra clave..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl text-base
                       focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-sm"
            style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
          />
        </div>

        {(loading || !restrictionsResolved) && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} />
          </div>
        )}

        {!loading && restrictionsResolved && trimmedQuery.length < MIN_QUERY_LENGTH && (
          <div className="text-center py-16">
            <IconSearch size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {trimmedQuery.length === 0
                ? `Escribí una palabra para empezar a buscar entre ${visibleQuestions.length} preguntas.`
                : `Escribí al menos ${MIN_QUERY_LENGTH} letras para buscar.`}
            </p>
          </div>
        )}

        {!loading && restrictionsResolved && trimmedQuery.length >= MIN_QUERY_LENGTH && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {results.length > 0
                ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${trimmedQuery}"`
                : `No se encontraron resultados para "${trimmedQuery}"`}
            </p>

            <div className="space-y-3">
              {results.map((q) => (
                <QuestionResultCard
                  key={q.id}
                  question={q}
                  onCopy={() => handleCopy(q)}
                  onViewInfo={() => handleViewInfo(q)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

interface QuestionResultCardProps {
  question: BankQuestion;
  onCopy: () => void;
  onViewInfo: () => void;
}

function QuestionResultCard({ question, onCopy, onViewInfo }: QuestionResultCardProps): JSX.Element {
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
            style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
          >
            <IconTag size={12} />
            {question.tag}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{question.category}</span>
        </div>

        <button
          type="button"
          onClick={handleCopyClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors shrink-0"
          style={{
            backgroundColor: copied ? '#DCFCE7' : `${ACCENT}15`,
            color: copied ? '#16A34A' : ACCENT,
          }}
          title="Copiar pregunta y respuesta"
        >
          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">{question.question}</p>

      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Respuesta</p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{question.answer}</p>
      </div>

      {question.resume && (
        <Disclosure>
          {({ open }) => (
            <div>
              <Disclosure.Button
                onClick={() => {
                  if (!open) onViewInfo();
                }}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-1.5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <IconInfoCircle size={15} />
                  Más información
                </span>
                <IconChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
              </Disclosure.Button>
              <Transition
                enter="transition duration-150 ease-out"
                enterFrom="opacity-0 -translate-y-1"
                enterTo="opacity-100 translate-y-0"
              >
                <Disclosure.Panel className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-1 pb-1">
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