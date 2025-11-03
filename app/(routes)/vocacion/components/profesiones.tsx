'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Briefcase, X } from 'lucide-react';
import Swal from 'sweetalert2';
import GameStatusBar from '@/components/GameStatusBar';
import { QUESTIONS, Question } from '../lib/questions';
import { PROFESSIONS } from '../lib/professions';

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

interface MoodEntry {
  date: string;
  mood: number;
  label: string;
  intensity: number;
  note?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  date?: string;
}

interface UserData {
  profile: {
    character: {
      id: number;
      name: string;
      image: string;
    };
    username: string;
    createdAt: string;
    lastLogin: string;
  };
  game: {
    totalScore: number;
    totalLives: number;
    streak: number;
  };
  progress: {
    completedActivities: string[];
    activityScores: { [key: string]: number };
    activityTimes: { [key: string]: string };
    lastVisits: { [key: string]: string };
    storyProgress: { [key: string]: { lastPage: number; percentage: number; pagesRead: string[] } };
    vocationalTest?: {
      answers: Record<number, boolean>;
      results?: Record<string, AreaResult>;
      professionAnswers?: ProfessionAnswers;
    };
  };
  mood: {
    history: MoodEntry[];
    lastEntry: MoodEntry | null;
  };
  achievements: Achievement[];
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en';
  };
}

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

const STORAGE_KEY = 'cresi_user_data';
const ACTIVITY_ID = 'VocationalTest';
const POINTS_PER_QUESTION = 50;
const COMPLETION_BONUS = 200;
const POINTS_PER_PROFESSION = 100;

// Función para crear datos de usuario por defecto
const createDefaultUserData = (): UserData => {
  return {
    profile: {
      character: {
        id: 1,
        name: 'Jugador',
        image: '/default-character.png',
      },
      username: 'Usuario',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    },
    game: {
      totalScore: 0,
      totalLives: 3,
      streak: 0,
    },
    progress: {
      completedActivities: [],
      activityScores: {},
      activityTimes: {},
      lastVisits: {},
      storyProgress: {},
      vocationalTest: {
        answers: {},
        results: undefined,
        professionAnswers: {},
      },
    },
    mood: {
      history: [],
      lastEntry: null,
    },
    achievements: [],
    settings: {
      notifications: true,
      theme: 'light',
      language: 'es',
    },
  };
};

export default function VocationalTest() {
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Record<string, AreaResult>>({});
  const [selectedProfession, setSelectedProfession] = useState<ProfessionTestState | null>(null);
  const [professionAnswers, setProfessionAnswers] = useState<ProfessionAnswers>({});
  const [userData, setUserData] = useState<UserData | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const storedData = window.localStorage.getItem(STORAGE_KEY);
      let data: UserData;

      if (storedData) {
        data = JSON.parse(storedData);
      } else {
        data = createDefaultUserData();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }

      setUserData(data);
      setScore(data.game.totalScore);
      setLives(data.game.totalLives);

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

      data.progress.lastVisits[ACTIVITY_ID] = new Date().toISOString();

      if (!data.progress.activityScores) {
        data.progress.activityScores = {};
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error loading user data:', error);
      const defaultData = createDefaultUserData();
      setUserData(defaultData);
      setScore(defaultData.game.totalScore);
      setLives(defaultData.game.totalLives);
    }
  };

  const saveUserData = (updatedData: UserData) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);
      setScore(updatedData.game.totalScore);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const saveTestProgress = (newAnswers: Record<number, boolean>, newResults?: Record<string, AreaResult>, newProfessionAnswers?: ProfessionAnswers) => {
    let currentUserData = userData;

    if (!currentUserData) {
      currentUserData = createDefaultUserData();
    }

    const updatedData: UserData = {
      ...currentUserData,
      game: {
        ...currentUserData.game,
        totalScore: currentUserData.game.totalScore + POINTS_PER_QUESTION
      },
      progress: {
        ...currentUserData.progress,
        vocationalTest: {
          answers: newAnswers,
          results: newResults || currentUserData.progress.vocationalTest?.results,
          professionAnswers: newProfessionAnswers || currentUserData.progress.vocationalTest?.professionAnswers,
        },
        activityScores: {
          ...currentUserData.progress.activityScores,
          [ACTIVITY_ID]: (currentUserData.progress.activityScores[ACTIVITY_ID] || 0) + POINTS_PER_QUESTION
        },
        activityTimes: {
          ...currentUserData.progress.activityTimes,
          [ACTIVITY_ID]: new Date().toISOString()
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
        handleCalculateResults();
      }, 500);
    }
  };

  const handleCalculateResults = () => {
    let currentUserData = userData;

    if (!currentUserData) {
      currentUserData = createDefaultUserData();
    }

    const counts: Record<string, number> = {
      'I': 0,
      'II': 0,
      'III': 0,
      'IV': 0,
      'V': 0,
    };

    Object.entries(answers).forEach(([questionId, interested]) => {
      if (interested) {
        const question = QUESTIONS.find(q => q.id === parseInt(questionId));
        if (question) {
          counts[question.area]++;
        }
      }
    });

    const formattedResults: Record<string, AreaResult> = {};
    Object.entries(counts).forEach(([area, count]) => {
      const questions = QUESTIONS.filter(
        q => q.area === area && answers[q.id]
      ).map(q => q.id);
      formattedResults[area] = {
        name: AREAS[area as keyof typeof AREAS].name,
        questions,
        total: count,
      };
    });

    setResults(formattedResults);

    const updatedData: UserData = {
      ...currentUserData,
      game: {
        ...currentUserData.game,
        totalScore: currentUserData.game.totalScore + COMPLETION_BONUS
      },
      progress: {
        ...currentUserData.progress,
        completedActivities: [...currentUserData.progress.completedActivities, ACTIVITY_ID],
        vocationalTest: {
          answers,
          results: formattedResults,
          professionAnswers,
        },
        activityScores: {
          ...currentUserData.progress.activityScores,
          [ACTIVITY_ID]: (currentUserData.progress.activityScores[ACTIVITY_ID] || 0) + COMPLETION_BONUS
        }
      }
    };

    saveUserData(updatedData);
    setShowResults(true);

    Swal.fire({
      icon: 'success',
      title: '¡Test completado!',
      html: `
        <p>Has completado el test de orientación vocacional.</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 8px;">
          <p style="font-weight: bold; color: #0369a1; margin-bottom: 8px;">¡Puntos ganados!</p>
          <p style="font-size: 14px; color: #0c4a6e;">
            +${POINTS_PER_QUESTION * QUESTIONS.length} por responder preguntas
          </p>
          <p style="font-size: 14px; color: #0c4a6e;">
            +${COMPLETION_BONUS} por completar el test
          </p>
          <p style="font-weight: bold; color: #0369a1; margin-top: 8px;">
            Total: +${POINTS_PER_QUESTION * QUESTIONS.length + COMPLETION_BONUS} puntos
          </p>
        </div>
      `,
      confirmButtonText: 'Continuar',
      allowOutsideClick: false,
      allowEscapeKey: false
    });
  };

  const handleProfessionAnswerClick = () => {
    let currentUserData = userData;

    if (!currentUserData) {
      currentUserData = createDefaultUserData();
    }

    if (!selectedProfession) return;

    const updatedData: UserData = {
      ...currentUserData,
      game: {
        ...currentUserData.game,
        totalScore: currentUserData.game.totalScore + POINTS_PER_PROFESSION
      },
      progress: {
        ...currentUserData.progress,
        vocationalTest: {
          ...currentUserData.progress.vocationalTest,
          answers: currentUserData.progress.vocationalTest?.answers ?? {},
          professionAnswers,
        },
        activityScores: {
          ...currentUserData.progress.activityScores,
          [ACTIVITY_ID]: (currentUserData.progress.activityScores[ACTIVITY_ID] || 0) + POINTS_PER_PROFESSION
        }
      }
    };

    saveUserData(updatedData);

    Swal.fire({
      icon: 'info',
      title: 'Puntos ganados',
      html: `
        <p>Has completado el test de actividades para <strong>${selectedProfession.name}</strong></p>
        <div style="margin-top: 15px; padding: 10px; background-color: #f0f9ff; border-radius: 8px;">
          <p style="font-weight: bold; color: #0369a1;">+${POINTS_PER_PROFESSION} puntos</p>
        </div>
      `,
      confirmButtonText: 'Continuar',
      timer: 3000
    });

    setSelectedProfession(null);
  };

  if (showResults) {
    const sortedResults = Object.entries(results)
      .sort((a, b) => b[1].total - a[1].total);

    return (
      <div className="min-h-screen bg-gray-50">
        <GameStatusBar
          title="Test Vocacional"
          score={score}
          lives={lives}
          level={Math.floor((Object.keys(answers).length / QUESTIONS.length) * 100)}
        />

        <div className="sticky top-10 bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Resultados de tu Test Vocacional</h1>
              <p className="text-sm text-gray-600 mt-1">Tus áreas de interés</p>
            </div>
            <button
              onClick={() => {
                setShowResults(false);
                setAnswers({});
                setCurrentQuestion(0);
                setResults({});
                setProfessionAnswers({});
                if (userData) {
                  const updatedData: UserData = {
                    ...userData,
                    progress: {
                      ...userData.progress,
                      vocationalTest: {
                        answers: {},
                        results: undefined,
                        professionAnswers: {},
                      }
                    }
                  };
                  saveUserData(updatedData);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Reiniciar Test
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {sortedResults.map(([areaKey, area]) => {
              const areaInfo = AREAS[areaKey as keyof typeof AREAS];
              return (
                <div
                  key={areaKey}
                  className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
                >
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
                      <span className="text-gray-700 font-medium text-xs">Puntuación</span>
                      <span className="text-2xl font-bold text-gray-800">{area.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
                <div key={`prof-${areaKey}`} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className={`bg-gradient-to-r ${areaInfo.color} p-6 text-white`}>
                    <h3 className="text-2xl font-bold flex items-center gap-3">
                      <Briefcase className="w-7 h-7" />
                      {area.name}
                    </h3>
                    <p className="text-sm opacity-90 mt-2">Elige la profesión que creas que te gusta y contestá 10 preguntas.</p>
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
                              className="flex flex-col gap-2 p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition border border-gray-200 hover:border-blue-300 text-left hover:shadow-md"
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
                                  <span className="text-xs font-bold text-gray-700 min-w-fit">{percentage}%</span>
                                </div>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 col-span-full">No hay profesiones disponibles</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Próximos Pasos
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Basado en tus resultados, tu mayor interés está en <span className="font-bold text-blue-600">{sortedResults[0]?.[1].name}</span>.
                Te recomendamos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Conversa con tus padres, maestros y orientadores sobre estos resultados</li>
                <li>Haz clic en las profesiones para explorar actividades específicas</li>
                <li>Responde el test de actividades para ver tu compatibilidad</li>
                <li>Investiga programas académicos relacionados con estas áreas</li>
                <li>Busca experiencias prácticas como talleres o voluntariados</li>
              </ul>
            </div>
          </div>
        </div>

        {selectedProfession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Test de Actividades</p>
                  <h2 className="text-2xl font-bold">{selectedProfession.name}</h2>
                </div>
                <button
                  onClick={() => {
                    handleProfessionAnswerClick();
                  }}
                  className="p-2 hover:bg-blue-600 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center justify-center px-8 py-12">
                {selectedProfession.currentActivityIndex < 10 ? (
                  <div className="w-full max-w-md text-center">
                    {PROFESSIONS[selectedProfession.areaKey]?.find(p => p.name === selectedProfession.name)?.activities[selectedProfession.currentActivityIndex] && (
                      <div>
                        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-6">
                          Actividad {selectedProfession.currentActivityIndex + 1} de 10
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
                          {PROFESSIONS[selectedProfession.areaKey]?.find(p => p.name === selectedProfession.name)?.activities[selectedProfession.currentActivityIndex].description}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                          <button
                            onClick={() => {
                              const newAnswers = [...(professionAnswers[selectedProfession.name] || [])];
                              newAnswers[selectedProfession.currentActivityIndex] = true;
                              setProfessionAnswers(prev => ({
                                ...prev,
                                [selectedProfession.name]: newAnswers,
                              }));

                              if (selectedProfession.currentActivityIndex < 9) {
                                setSelectedProfession(prev => prev ? { ...prev, currentActivityIndex: prev.currentActivityIndex + 1 } : null);
                              } else {
                                setSelectedProfession(prev => prev ? { ...prev, currentActivityIndex: prev.currentActivityIndex + 1 } : null);
                              }
                            }}
                            className="p-6 border-2 border-gray-300 rounded-lg text-center hover:border-green-500 hover:bg-green-50 transition group"
                          >
                            <div className="font-medium text-gray-800 group-hover:text-green-700 text-lg">
                              ✓ Me interesa
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              const newAnswers = [...(professionAnswers[selectedProfession.name] || [])];
                              newAnswers[selectedProfession.currentActivityIndex] = false;
                              setProfessionAnswers(prev => ({
                                ...prev,
                                [selectedProfession.name]: newAnswers,
                              }));

                              if (selectedProfession.currentActivityIndex < 9) {
                                setSelectedProfession(prev => prev ? { ...prev, currentActivityIndex: prev.currentActivityIndex + 1 } : null);
                              } else {
                                setSelectedProfession(prev => prev ? { ...prev, currentActivityIndex: prev.currentActivityIndex + 1 } : null);
                              }
                            }}
                            className="p-6 border-2 border-gray-300 rounded-lg text-center hover:border-red-500 hover:bg-red-50 transition group"
                          >
                            <div className="font-medium text-gray-800 group-hover:text-red-700 text-lg">
                              ✗ No me interesa
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full max-w-md">
                    <div className="bg-blue-50 rounded-lg p-8 border-2 border-blue-200">
                      <h3 className="text-xl font-bold text-gray-800 mb-6">¡Test completado!</h3>
                      <div className="flex items-end justify-center mb-6">
                        <span className="text-6xl font-bold text-blue-600">
                          {Math.round(
                            ((professionAnswers[selectedProfession.name]?.filter(a => a).length || 0) / 10) * 100
                          )}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-6">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                          style={{
                            width: `${
                              Math.round(
                                ((professionAnswers[selectedProfession.name]?.filter(a => a).length || 0) / 10) * 100
                              )
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-gray-600 mb-4">
                        Tu compatibilidad con <span className="font-bold">{selectedProfession.name}</span>
                      </p>
                      <p className="text-sm text-gray-500 mb-6">
                        Has seleccionado {professionAnswers[selectedProfession.name]?.filter(a => a).length || 0} de 10 actividades de interés
                      </p>
                      <button
                        onClick={() => {
                          handleProfessionAnswerClick();
                        }}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GameStatusBar
        title="Test Vocacional"
        score={score}
        lives={lives}
        currentQuestion={currentQuestion + 1}
        totalQuestions={QUESTIONS.length}
        level={currentQuestion + 1}
      />

      <div className="flex items-center justify-center px-2 py-8">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                {currentQuestion + 1} / {QUESTIONS.length}
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 leading-relaxed">
                {question?.text}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswer(true)}
                className="p-6 border-2 border-gray-300 rounded-lg text-left hover:border-green-500 hover:bg-green-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-green-500 group-hover:bg-green-500 transition flex items-center justify-center">
                    {answers[question?.id] === true && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="font-medium text-gray-800 group-hover:text-green-700">
                    Me interesa
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAnswer(false)}
                className="p-6 border-2 border-gray-300 rounded-lg text-left hover:border-red-500 hover:bg-red-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-red-500 group-hover:bg-red-500 transition flex items-center justify-center">
                    {answers[question?.id] === false && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="font-medium text-gray-800 group-hover:text-red-700">
                    No me interesa
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-3 text-center text-xs text-gray-500 border-t border-gray-200">
            <p>+{POINTS_PER_QUESTION} puntos por cada pregunta • +{COMPLETION_BONUS} bonus al finalizar • +{POINTS_PER_PROFESSION} por test de profesión</p>
          </div>
        </div>
      </div>
    </div>
  );
}
