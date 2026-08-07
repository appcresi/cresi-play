import React, { useEffect, useState, useRef, useMemo } from 'react';
import { IconLoader, IconCheck, IconTag, IconChevronDown, IconSearch } from '@tabler/icons-react';
import ClassroomService from '@/lib/classroomService';
import type { Classroom } from '@/types/classroom';
import { loadQuestionBank, getDistinctTags, type BankQuestion } from '@/lib/questionSearch';
import { SaveIndicator } from './SaveIndicator';

// El color del buscador de preguntas — es indigo, no pertenece a ninguna
// actividad puntual del catálogo (mismo que en la pantalla del alumno).
const QUESTIONS_ACCENT = '#4F46E5';

// ==================== "Preguntas del buscador" (inline, autoguardado) ====================
//
// A diferencia de Actividades/Trivias (que guardan qué está PERMITIDO),
// acá guardamos qué está BLOQUEADO — con ~40 etiquetas y 1000 preguntas,
// tiene más sentido "todo visible salvo lo que bloquees" que "nada visible
// hasta que lo marques uno por uno". Además, una etiqueta nueva que se
// agregue al banco en el futuro queda visible por default, sin que el
// docente tenga que acordarse de habilitarla.
//
// Las tarjetas en color = visibles; en gris = bloqueadas. Al expandir una
// etiqueta permitida, se pueden destildar preguntas puntuales dentro de
// ella (quedan bloqueadas aunque la etiqueta en general esté permitida).

export const QuestionsPicker = ({
  classroom,
  onChanged,
}: {
  classroom: Classroom;
  onChanged: (restrictedTags: string[] | null, restrictedQuestionIds: string[] | null) => void;
}) => {
  const [allQuestions, setAllQuestions] = useState<BankQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [blockedTags, setBlockedTags] = useState<Set<string>>(new Set(classroom.restrictedTags ?? []));
  const [blockedQuestionIds, setBlockedQuestionIds] = useState<Set<string>>(
    new Set(classroom.restrictedQuestionIds ?? [])
  );
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadQuestionBank()
      .then(setAllQuestions)
      .finally(() => setLoadingQuestions(false));
  }, []);

  const tags = useMemo(() => getDistinctTags(allQuestions), [allQuestions]);
  const questionsByTag = useMemo(() => {
    const map: Record<string, BankQuestion[]> = {};
    allQuestions.forEach((q) => {
      if (!map[q.tag]) map[q.tag] = [];
      map[q.tag].push(q);
    });
    return map;
  }, [allQuestions]);

  const filteredTags = tagFilter.trim()
    ? tags.filter((t) => t.toLowerCase().includes(tagFilter.trim().toLowerCase()))
    : tags;

  const scheduleSave = (nextTags: Set<string>, nextQuestionIds: Set<string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        const tagsValue = nextTags.size === 0 ? null : Array.from(nextTags);
        const idsValue = nextQuestionIds.size === 0 ? null : Array.from(nextQuestionIds);
        await Promise.all([
          ClassroomService.updateRestrictedTags(classroom.id, tagsValue),
          ClassroomService.updateRestrictedQuestionIds(classroom.id, idsValue),
        ]);
        onChanged(tagsValue, idsValue);
        setSaveState('saved');
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500);
      } catch (err) {
        console.error(err);
        setSaveState('error');
      }
    }, 600);
  };

  const toggleTag = (tag: string) => {
    setBlockedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      scheduleSave(next, blockedQuestionIds);
      return next;
    });
  };

  const toggleQuestion = (id: string) => {
    setBlockedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      scheduleSave(blockedTags, next);
      return next;
    });
  };

  const allowAll = () => {
    setBlockedTags(new Set());
    setBlockedQuestionIds(new Set());
    scheduleSave(new Set(), new Set());
  };

  const visibleTagCount = tags.length - blockedTags.size;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          <IconTag className="w-4 h-4 text-indigo-600" />
          Preguntas del buscador
        </h3>
        {!loadingQuestions && <SaveIndicator state={saveState} />}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Tocá una etiqueta para prenderla/apagarla en el buscador de tus alumnos — se guarda
        solo ({visibleTagCount}/{tags.length} etiquetas visibles). Para destildar preguntas
        puntuales dentro de una etiqueta permitida, tocá la flecha para desplegarla.
      </p>

      {loadingQuestions ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <IconLoader className="w-5 h-5 animate-spin" />
        </div>
      ) : tags.length === 0 ? (
        <p className="text-sm text-gray-500">No se pudo cargar el banco de preguntas.</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={allowAll} className="text-indigo-600 hover:underline text-xs font-medium shrink-0">
              Permitir todas
            </button>
            <div className="relative flex-1 max-w-xs">
              <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="Filtrar etiquetas..."
                className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredTags.map((tag) => {
              const isBlocked = blockedTags.has(tag);
              const questionsForTag = questionsByTag[tag] ?? [];
              const blockedInTag = questionsForTag.filter((q) => blockedQuestionIds.has(q.id)).length;
              const isExpanded = expandedTag === tag;

              return (
                <div
                  key={tag}
                  className={`rounded-xl border-2 p-3 transition-all min-w-0 ${
                    isBlocked
                      ? 'border-gray-100 opacity-50 grayscale'
                      : 'border-transparent shadow-sm'
                  }`}
                  style={!isBlocked ? { borderColor: QUESTIONS_ACCENT, backgroundColor: `${QUESTIONS_ACCENT}0D` } : undefined}
                >
                  <button type="button" onClick={() => toggleTag(tag)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: isBlocked ? '#9CA3AF' : QUESTIONS_ACCENT }}
                      >
                        <IconTag className="w-4 h-4" />
                      </div>
                      {!isBlocked && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: QUESTIONS_ACCENT }}
                        >
                          <IconCheck className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 break-words">{tag}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      {questionsForTag.length} pregunta{questionsForTag.length !== 1 ? 's' : ''}
                      {blockedInTag > 0 && !isBlocked && ` · ${blockedInTag} bloqueada${blockedInTag !== 1 ? 's' : ''}`}
                    </p>
                  </button>

                  {!isBlocked && (
                    <button
                      type="button"
                      onClick={() => setExpandedTag(isExpanded ? null : tag)}
                      className="w-full flex items-center justify-center gap-1 text-[10px] text-gray-500 hover:text-indigo-600 mt-2 pt-2 border-t border-gray-100"
                    >
                      {isExpanded ? 'Ocultar preguntas' : 'Ver preguntas'}
                      <IconChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {isExpanded && !isBlocked && (
                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5 max-h-48 overflow-y-auto">
                      {questionsForTag.map((q) => {
                        const isQuestionBlocked = blockedQuestionIds.has(q.id);
                        return (
                          <label
                            key={q.id}
                            className="flex items-start gap-1.5 text-[11px] leading-snug cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={!isQuestionBlocked}
                              onChange={() => toggleQuestion(q.id)}
                              className="mt-0.5 shrink-0"
                            />
                            <span className={isQuestionBlocked ? 'text-gray-400 line-through' : 'text-gray-700'}>
                              {q.question}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};