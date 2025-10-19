"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import GameStatusBar from '@/components/GameStatusBar';

// Interfaces
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

// Preguntas del test
const questions = [
  "Me siento estresado(a) la mayor parte del tiempo.",
  "Tengo problemas para concentrarme en las tareas diarias.",
  "Me siento triste o deprimido(a) sin razón aparente.",
  "Tengo dificultades para dormir o duermo demasiado.",
  "Me siento solo(a) incluso cuando estoy con otras personas.",
  "Me siento abrumado(a) por las responsabilidades.",
  "Pierdo el interés en actividades que solía disfrutar.",
  "Siento que no tengo suficiente energía para el día.",
  "Evito socializar o interactuar con otras personas.",
  "Me preocupo excesivamente por cosas que no puedo controlar.",
  "Siento que no soy lo suficientemente bueno(a) en lo que hago.",
  "Tengo ataques de pánico o ansiedad sin previo aviso.",
  "Me siento irritado(a) o molesto(a) con frecuencia.",
  "Tengo cambios de humor repentinos.",
  "Me resulta difícil tomar decisiones incluso sobre cosas simples.",
  "Siento que no tengo control sobre mi vida.",
  "Me preocupa mucho mi apariencia física o peso.",
  "Tengo pensamientos negativos sobre mí mismo(a).",
  "Me siento inseguro(a) acerca de mi futuro.",
  "Tengo ganas de llorar sin razón aparente.",
  "Me siento culpable por cosas que no puedo cambiar.",
  "Me aíslo cuando me siento abrumado(a).",
  "Siento que nadie me entiende.",
  "Me resulta difícil expresar mis emociones.",
  "Siento que no puedo lidiar con mis problemas."
];

// Resultados basados en la puntuación
const results = [
    "Tu salud mental parece estar en buen estado. Sigue cuidándote. Este resultado indica que estás manejando bien tus emociones y no presentas signos de estrés significativo. Es importante que continúes con hábitos saludables, como practicar la auto-reflexión, mantener relaciones positivas y cuidar de tu bienestar emocional en general. No olvides que la salud mental también requiere atención continua, así que sigue haciendo actividades que te hagan sentir bien y buscar apoyo cuando lo necesites.",
    
    "Podrías estar experimentando algunos niveles de estrés. Considera buscar apoyo emocional. Este resultado sugiere que podrías estar lidiando con situaciones que te generan ansiedad o preocupación. Es normal sentir estrés de vez en cuando, pero es importante que no lo minimices. Hablar con amigos, familiares o un profesional puede ayudarte a poner en perspectiva tus sentimientos y encontrar estrategias para manejarlos de manera más efectiva. No estás solo en esto y hay recursos disponibles para vos.",
  
    "Estás mostrando signos de estrés o ansiedad. Sería útil hablar con alguien de confianza o un profesional. Este resultado indica que tus respuestas sugieren una carga emocional que podría estar afectando tu bienestar diario. Puede ser útil identificar las fuentes de este estrés y abordar tus sentimientos de manera proactiva. Considera buscar la ayuda de un terapeuta o consejero que pueda ofrecerte apoyo y herramientas para gestionar tus emociones de manera saludable. Reconocer que necesitas ayuda es un paso valiente y positivo hacia la mejora de tu salud mental.",
  
    "Es importante que busques ayuda de un profesional para abordar tus emociones y bienestar mental. Este resultado sugiere que podrías estar enfrentando desafíos significativos que merecen atención especializada. Si has sentido que tu salud mental se ve comprometida o que tus emociones son abrumadoras, buscar la ayuda de un profesional es esencial. No hay vergüenza en pedir apoyo; los profesionales de la salud mental están capacitados para ayudarte a explorar tus sentimientos y desarrollar estrategias efectivas para mejorar tu bienestar. Priorizar tu salud mental es un signo de fortaleza."
];

// Interfaces
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

/** Calcular la gravedad (o importancia) en base a la puntuación. */
function calculateImportance(score: number): number {
    switch (true) {
      case score <= 30:
        return 0;
      case score <= 45:
        return 1;
      case score <= 50:
        return 2;
      default:
        return 3;
    }
  }

const STORAGE_KEY = 'cresi_user_data';
const ACTIVITY_ID = 'SaludMentalTest';
const POINTS_PER_QUESTION = 50;
const COMPLETION_BONUS = 200;

export default function Test(): JSX.Element {
  const [actualQuestion, setActualQuestion] = useState<number>(0);
  const [testScore, setTestScore] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hasShownResult, setHasShownResult] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const oneQuestion = 100 / questions.length;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    try {
      const storedData = window.localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: UserData = JSON.parse(storedData);
        setUserData(data);
        setScore(data.game.totalScore);
        setLives(data.game.totalLives);
        
        // Actualizar última visita
        data.progress.lastVisits[ACTIVITY_ID] = new Date().toISOString();
        
        // Inicializar si no existe
        if (!data.progress.activityScores) {
          data.progress.activityScores = {};
        }
        
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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

  function handleAnswerSubmit(answerScore: 1 | 2 | 3 | 4): void {
    if (!userData) return;

    const newTestScore = testScore + answerScore;
    setTestScore(newTestScore);
    const newPercentage = percentage + oneQuestion;
    setPercentage(newPercentage);

    // Guardar puntos por pregunta contestada
    const updatedData: UserData = {
      ...userData,
      game: {
        ...userData.game,
        totalScore: userData.game.totalScore + POINTS_PER_QUESTION
      },
      progress: {
        ...userData.progress,
        activityScores: {
          ...userData.progress.activityScores,
          [ACTIVITY_ID]: (userData.progress.activityScores[ACTIVITY_ID] || 0) + POINTS_PER_QUESTION
        },
        activityTimes: {
          ...userData.progress.activityTimes,
          [ACTIVITY_ID]: new Date().toISOString()
        }
      }
    };

    saveUserData(updatedData);

    if (actualQuestion === questions.length - 1) {
      setIsFinished(true);
    } else {
      setActualQuestion((previous) => previous + 1);
    }
  }

  useEffect(() => {
    if (isFinished && userData && !hasShownResult) {
      setHasShownResult(true);
      
      // Agregar bonus de finalización
      const finalData: UserData = {
        ...userData,
        game: {
          ...userData.game,
          totalScore: userData.game.totalScore + COMPLETION_BONUS
        },
        progress: {
          ...userData.progress,
          completedActivities: [
            ...userData.progress.completedActivities,
            ACTIVITY_ID
          ],
          activityScores: {
            ...userData.progress.activityScores,
            [ACTIVITY_ID]: (userData.progress.activityScores[ACTIVITY_ID] || 0) + COMPLETION_BONUS
          }
        }
      };

      saveUserData(finalData);

      Swal.fire({
        icon: "question",
        title: "Resultado",
        html: `
          <p>${results[calculateImportance(testScore)]}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-radius: 8px;">
            <p style="font-weight: bold; color: #0369a1; margin-bottom: 8px;">¡Puntos ganados!</p>
            <p style="font-size: 14px; color: #0c4a6e;">
              +${POINTS_PER_QUESTION * questions.length} por responder preguntas
            </p>
            <p style="font-size: 14px; color: #0c4a6e;">
              +${COMPLETION_BONUS} por completar el test
            </p>
            <p style="font-weight: bold; color: #0369a1; margin-top: 8px;">
              Total: +${POINTS_PER_QUESTION * questions.length + COMPLETION_BONUS} puntos
            </p>
          </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Volver a empezar",
        denyButtonText: "Ir a Historias",
        cancelButtonText: "Volver al Inicio",
        allowOutsideClick: false,
        allowEscapeKey: false
      })
        .then((value) => {
          if (value.isConfirmed) {
            setActualQuestion(0);
            setTestScore(0);
            setPercentage(0);
            setIsFinished(false);
            setHasShownResult(false);
            loadUserData();
          } else if (value.isDenied) {
            window.location.href = '/historias';
          } else if (value.dismiss === Swal.DismissReason.cancel) {
            window.location.href = '/';
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [isFinished, hasShownResult]);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <GameStatusBar
        title="Test de Salud Mental"
        score={score}
        lives={lives}
        level={actualQuestion + 1}
      />

      <div className="p-4 md:p-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Main Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso</span>
                <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Question Counter and Content */}
            <div key={`question-${questions[actualQuestion]}`} className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">
                    {actualQuestion + 1}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pregunta {actualQuestion + 1} de {questions.length}</p>
                  <p className="text-sm text-gray-600">Progreso del cuestionario</p>
                </div>
              </div>

              {/* Question Text */}
              <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xl text-gray-800 font-medium leading-relaxed">
                  {questions[actualQuestion]}
                </p>
              </div>
            </div>

            {/* Answer Buttons */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-4">¿Cuál es tu respuesta?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { text: 'No', value: 1 as 1, color: 'bg-green-50 border-green-200 hover:bg-green-100' },
                  { text: 'Rara vez', value: 2 as 2, color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
                  { text: 'A veces', value: 3 as 3, color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
                  { text: 'Sí', value: 4 as 4, color: 'bg-red-50 border-red-200 hover:bg-red-100' }
                ].map((answer) => (
                  <button
                    key={answer.text}
                    type="button"
                    onClick={() => handleAnswerSubmit(answer.value)}
                    className={`
                      py-3 px-4 rounded-lg border-2 font-medium text-gray-800
                      transition-all duration-200
                      ${answer.color}
                      hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    `}
                  >
                    {answer.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Tu privacidad es importante. Los datos se procesan de forma segura.</p>
            <p className="mt-2 text-xs">+{POINTS_PER_QUESTION} puntos por cada pregunta • +{COMPLETION_BONUS} bonus al finalizar</p>
          </div>
        </div>
      </div>
    </section>
  );
}