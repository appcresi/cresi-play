'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { IconCircleCheck, IconBriefcase, IconX } from '@tabler/icons-react';
import { QUESTIONS } from '../lib/questions';
import { PROFESSIONS } from '../lib/professions';
import UserDataManager from '@/lib/userDataManager';
import { getActivityById } from '@/lib/activities';

interface AreaResult {
  name: string;
  questions: number[];
  total: number;
}

interface ProfessionTestState {
  name: string;
  areaKey: string;
  currentActivityIndex: number;
}

interface ProfessionAnswers {
  [professionName: string]: boolean[];
}

const ACTIVITY = getActivityById('vocacion');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Test Vocacional';
const ACCENT = ACTIVITY?.color ?? '#388E3C';

// Colores por área — son semánticos (distinguen las 5 áreas entre sí),
// no de marca, así que no se tocan al recolorear el resto de la UI.
const AREAS = {
  'I': {
    name: 'Arte y Creatividad',
    color: 'from-purple-500 to-pink-500',
    icon: '🎨',
  },
  'II': {
    name: 'Ciencias Sociales',
    color: 'from-blue-500 to-cyan-500',
    icon: '📚',
  },
  'III': {
    name: 'Economía, Administración y Finanzas',
    color: 'from-green-500 to-emerald-500',
    icon: '💼',
  },
  'IV': {
    name: 'Ciencia y Tecnología',
    color: 'from-orange-500 to-red-500',
    icon: '🔬',
  },
  'V': {
    name: 'Ciencias Ecológicas, Biológicas y de Salud',
    color: 'from-teal-500 to-green-500',
    icon: '🌿',
  },
};

const POINTS_PER_QUESTION = 50;
const COMPLETION_BONUS = 200;
const POINTS_PER_PROFESSION = 100;

interface VocationalTestProps {
  onScoreChange?: (newScore: number) => void;
}

export default function VocationalTest({ onScoreChange }: VocationalTestProps) {
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Record<string, AreaResult>>({});
  const [selectedProfession, setSelectedProfession] = useState<ProfessionTestState | null>(null);
  const [professionAnswers, setProfessionAnswers] = useState<ProfessionAnswers>({});
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    onScoreChange?.(data.game.totalScore);
    UserDataManager.visitActivity(ACTIVITY_TITLE);

    if (data.progress.vocationalTest) {
      setAnswers(data.progress.vocationalTest.answers || {});
      if (data.progress.vocationalTest.results) {
        setResults(data.progress.vocationalTest.results);
        setShowResults(true);
      }
      if (data.progress.vocationalTest.professionAnswers) {
        setProfessionAnswers(data.progress.vocationalTest.professionAnswers);
      }
    }
  };

  const saveUserData = (updatedData: typeof userData) => {
    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
    onScoreChange?.(updatedData.game.totalScore);
  };

  const saveTestProgress = (newAnswers: Record<number, boolean>, newResults?: Record<string, AreaResult>, newProfessionAnswers?: ProfessionAnswers) => {
    const current = UserDataManager.loadUserData();

    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + POINTS_PER_QUESTION
      },
      progress: {
        ...current.progress,
        vocationalTest: {
          answers: newAnswers,
          results: newResults || current.progress.vocationalTest?.results,
          professionAnswers: newProfessionAnswers || current.progress.vocationalTest?.professionAnswers,
        },
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + POINTS_PER_QUESTION
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [ACTIVITY_TITLE]: new Date().toISOString()
        }
      }
    };

    saveUserData(updatedData);
  };

  const handleAnswer = (value: boolean) => {
    const newAnswers = {
      ...answers,
      [QUESTIONS[currentQuestion].id]: value,
    };
    setAnswers(newAnswers);
    saveTestProgress(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimeout(() => {
        handleCalculateResults(newAnswers);
      }, 500);
    }
  };

  // Antes esto agregaba ACTIVITY_ID a completedActivities sin fijarse si
  // ya estaba ahí — cada vez que alguien reiniciaba el test, quedaba
  // duplicado en la lista.
  const handleCalculateResults = (finalAnswers: Record<number, boolean>) => {
    const counts: Record<string, number> = { 'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0 };

    Object.entries(finalAnswers).forEach(([questionId, interested]) => {
      if (interested) {
        const question = QUESTIONS.find(q => q.id === parseInt(questionId));
        if (question) {
          counts[question.area]++;
        }
      }
    });

    const formattedResults: Record<string, AreaResult> = {};
    Object.entries(counts).forEach(([area, count]) => {
      const questionsInArea = QUESTIONS.filter(
        q => q.area === area && finalAnswers[q.id]
      ).map(q => q.id);
      formattedResults[area] = {
        name: AREAS[area as keyof typeof AREAS].name,
        questions: questionsInArea,
        total: count,
      };
    });

    setResults(formattedResults);

    const current = UserDataManager.loadUserData();
    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + COMPLETION_BONUS
      },
      progress: {
        ...current.progress,
        completedActivities: !current.progress.completedActivities.includes(ACTIVITY_TITLE)
          ? [...current.progress.completedActivities, ACTIVITY_TITLE]
          : current.progress.completedActivities,
        vocationalTest: {
          answers: finalAnswers,
          results: formattedResults,
          professionAnswers,
        },
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + COMPLETION_BONUS
        }
      }
    };

    saveUserData(updatedData);
    setShowResults(true);

    toast.success(
      `¡Test completado! +${POINTS_PER_QUESTION * QUESTIONS.length + COMPLETION_BONUS} puntos en total`,
      { duration: 3000 }
    );
  };

  const handleProfessionAnswerClick = () => {
    if (!selectedProfession) return;
    const current = UserDataManager.loadUserData();

    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + POINTS_PER_PROFESSION
      },
      progress: {
        ...current.progress,
        vocationalTest: {
          ...current.progress.vocationalTest,
          answers: current.progress.vocationalTest?.answers ?? {},
          professionAnswers,
        },
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + POINTS_PER_PROFESSION
        }
      }
    };

    saveUserData(updatedData);
    toast.success(`+${POINTS_PER_PROFESSION} puntos por ${selectedProfession.name}`, { duration: 2000 });
    setSelectedProfession(null);
  };

  const resetTest = () => {
    setShowResults(false);
    setAnswers({});
    setCurrentQuestion(0);
    setResults({});
    setProfessionAnswers({});

    const current = UserDataManager.loadUserData();
    const updatedData = {
      ...current,
      progress: {
        ...current.progress,
        vocationalTest: {
          answers: {},
          results: undefined,
          professionAnswers: {},
        }
      }
    };
    saveUserData(updatedData);
  };

  if (showResults) {
    const sortedResults = Object.entries(results).sort((a, b) => b[1].total - a[1].total);

    return (
      <div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Resultados de tu Test Vocacional</h1>
              <p className="text-sm text-gray-500 mt-1">Tus áreas de interés</p>
            </div>
            <button
              onClick={resetTest}
              className="px-4 py-2 text-white rounded-full font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: ACCENT }}
            >
              Reiniciar Test
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {sortedResults.map(([areaKey, area]) => {
            const areaInfo = AREAS[areaKey as keyof typeof AREAS];
            return (
              <div key={areaKey} className="rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className={`bg-gradient-to-r ${areaInfo.color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium opacity-90">Área {areaKey}</p>
                      <h3 className="text-sm font-bold line-clamp-2">{area.name}</h3>
                    </div>
                    <div className="text-2xl">{areaInfo.icon}</div>
                  </div>
                </div>
                <div className="bg-white p-4">
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-gray-500 font-medium text-xs">Puntuación</span>
                    <span className="text-2xl font-bold text-gray-800">{area.total}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${areaInfo.color} transition-all duration-500`}
                      style={{ width: `${(area.total / 16) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-8">
          {sortedResults.slice(0, 2).map(([areaKey, area]) => {
            const areaInfo = AREAS[areaKey as keyof typeof AREAS];
            const professions = PROFESSIONS[areaKey] || [];
            return (
              <div key={`prof-${areaKey}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`bg-gradient-to-r ${areaInfo.color} p-6 text-white`}>
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <IconBriefcase className="w-6 h-6" />
                    {area.name}
                  </h3>
                  <p className="text-sm opacity-90 mt-2">Elegí la profesión que creas que te gusta y contestá 10 preguntas.</p>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {professions && professions.length > 0 ? (
                      professions.map((profession, index) => {
                        const profAnswers = professionAnswers[profession.name] || [];
                        const percentage = profAnswers.length > 0
                          ? Math.round((profAnswers.filter(a => a).length / 10) * 100)
                          : 0;

                        return (
                          <button
                            key={`${areaKey}-prof-${index}`}
                            onClick={() => setSelectedProfession({ name: profession.name, areaKey, currentActivityIndex: 0 })}
                            className="flex flex-col gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-200 text-left hover:shadow-sm"
                          >
                            <span className="text-gray-800 font-semibold text-sm">{profession.name}</span>
                            {profAnswers.length > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full bg-gradient-to-r ${areaInfo.color} transition-all`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-gray-600 min-w-fit">{percentage}%</span>
                              </div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-gray-400 col-span-full">No hay profesiones disponibles</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <IconCircleCheck className="w-5 h-5 text-green-600" />
            Próximos Pasos
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Basado en tus resultados, tu mayor interés está en{' '}
              <span className="font-bold" style={{ color: ACCENT }}>{sortedResults[0]?.[1].name}</span>. Te recomendamos:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
              <li>Conversá con tus padres, maestros y orientadores sobre estos resultados</li>
              <li>Hacé clic en las profesiones para explorar actividades específicas</li>
              <li>Respondé el test de actividades para ver tu compatibilidad</li>
              <li>Investigá programas académicos relacionados con estas áreas</li>
              <li>Buscá experiencias prácticas como talleres o voluntariados</li>
            </ul>
          </div>
        </div>

        {selectedProfession && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 text-white flex items-center justify-between" style={{ backgroundColor: ACCENT }}>
                <div>
                  <p className="text-sm opacity-90">Test de Actividades</p>
                  <h2 className="text-xl font-bold">{selectedProfession.name}</h2>
                </div>
                <button
                  onClick={handleProfessionAnswerClick}
                  className="p-2 hover:bg-white/20 rounded-full transition"
                  aria-label="Cerrar"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-center px-8 py-12">
                {selectedProfession.currentActivityIndex < 10 ? (
                  <div className="w-full max-w-md text-center">
                    {PROFESSIONS[selectedProfession.areaKey]?.find(p => p.name === selectedProfession.name)?.activities[selectedProfession.currentActivityIndex] && (
                      <div>
                        <div
                          className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6"
                          style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                        >
                          Actividad {selectedProfession.currentActivityIndex + 1} de 10
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-8 leading-relaxed">
                          {PROFESSIONS[selectedProfession.areaKey]?.find(p => p.name === selectedProfession.name)?.activities[selectedProfession.currentActivityIndex].description}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                          <button
                            onClick={() => {
                              const newAnswers = [...(professionAnswers[selectedProfession.name] || [])];
                              newAnswers[selectedProfession.currentActivityIndex] = true;
                              setProfessionAnswers(prev => ({ ...prev, [selectedProfession.name]: newAnswers }));
                              setSelectedProfession(prev => prev ? { ...prev, currentActivityIndex: prev.currentActivityIndex + 1 } : null);
                            }}
                            className="p-6 border-2 border-gray-200 rounded-xl text-center hover:border-green-500 hover:bg-green-50 transition group"
                          >
                            <div className="font-medium text-gray-800 group-hover:text-green-700">
                              ✓ Me interesa
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              const newAnswers = [...(professionAnswers[selectedProfession.name] || [])];
                              newAnswers[selectedProfession.currentActivityIndex] = false;
                              setProfessionAnswers(prev => ({ ...prev, [selectedProfession.name]: newAnswers }));
                              setSelectedProfession(prev => prev ? { ...prev, currentActivityIndex: prev.currentActivityIndex + 1 } : null);
                            }}
                            className="p-6 border-2 border-gray-200 rounded-xl text-center hover:border-red-500 hover:bg-red-50 transition group"
                          >
                            <div className="font-medium text-gray-800 group-hover:text-red-700">
                              ✗ No me interesa
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full max-w-md">
                    <div className="rounded-xl p-8 border-2" style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}>
                      <h3 className="text-lg font-bold text-gray-900 mb-6">¡Test completado!</h3>
                      <div className="flex items-end justify-center mb-6">
                        <span className="text-5xl font-bold" style={{ color: ACCENT }}>
                          {Math.round(((professionAnswers[selectedProfession.name]?.filter(a => a).length || 0) / 10) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-6">
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${Math.round(((professionAnswers[selectedProfession.name]?.filter(a => a).length || 0) / 10) * 100)}%`,
                            backgroundColor: ACCENT
                          }}
                        />
                      </div>
                      <p className="text-gray-600 mb-1 text-sm">
                        Tu compatibilidad con <span className="font-bold">{selectedProfession.name}</span>
                      </p>
                      <p className="text-xs text-gray-400 mb-6">
                        Seleccionaste {professionAnswers[selectedProfession.name]?.filter(a => a).length || 0} de 10 actividades de interés
                      </p>
                      <button
                        onClick={handleProfessionAnswerClick}
                        className="w-full px-6 py-3 text-white font-semibold rounded-full hover:opacity-90 transition"
                        style={{ backgroundColor: ACCENT }}
                      >
                        Cerrar y ver resultados
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <div className="flex items-center justify-center px-2">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          <div className="mb-8">
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
            >
              {currentQuestion + 1} / {QUESTIONS.length}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
              {question?.text}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer(true)}
              className="p-6 border-2 border-gray-200 rounded-xl text-left hover:border-green-500 hover:bg-green-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-green-500 group-hover:bg-green-500 transition flex items-center justify-center">
                  {answers[question?.id] === true && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="font-medium text-gray-800 group-hover:text-green-700">
                  Me interesa
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAnswer(false)}
              className="p-6 border-2 border-gray-200 rounded-xl text-left hover:border-red-500 hover:bg-red-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-red-500 group-hover:bg-red-500 transition flex items-center justify-center">
                  {answers[question?.id] === false && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="font-medium text-gray-800 group-hover:text-red-700">
                  No me interesa
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-3 text-center text-xs text-gray-400 border-t border-gray-100">
          <p>+{POINTS_PER_QUESTION} puntos por cada pregunta • +{COMPLETION_BONUS} bonus al finalizar • +{POINTS_PER_PROFESSION} por test de profesión</p>
        </div>
      </div>
    </div>
  );
}