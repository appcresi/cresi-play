"use client";

import { useEffect, useState } from "react";
import { IconHeartHandshake, IconRefresh, IconBooks, IconHome } from "@tabler/icons-react";
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';

const ACTIVITY = getActivityById('saludmental');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Salud Mental Test';
const ACCENT = ACTIVITY?.color ?? '#388E3C';

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

const results = [
    "Tu salud mental parece estar en buen estado. Sigue cuidándote. Este resultado indica que estás manejando bien tus emociones y no presentas signos de estrés significativo. Es importante que continúes con hábitos saludables, como practicar la auto-reflexión, mantener relaciones positivas y cuidar de tu bienestar emocional en general. No olvides que la salud mental también requiere atención continua, así que sigue haciendo actividades que te hagan sentir bien y buscar apoyo cuando lo necesites.",

    "Podrías estar experimentando algunos niveles de estrés. Considera buscar apoyo emocional. Este resultado sugiere que podrías estar lidiando con situaciones que te generan ansiedad o preocupación. Es normal sentir estrés de vez en cuando, pero es importante que no lo minimices. Hablar con amigos, familiares o un profesional puede ayudarte a poner en perspectiva tus sentimientos y encontrar estrategias para manejarlos de manera más efectiva. No estás solo en esto y hay recursos disponibles para vos.",

    "Estás mostrando signos de estrés o ansiedad. Sería útil hablar con alguien de confianza o un profesional. Este resultado indica que tus respuestas sugieren una carga emocional que podría estar afectando tu bienestar diario. Puede ser útil identificar las fuentes de este estrés y abordar tus sentimientos de manera proactiva. Considera buscar la ayuda de un terapeuta o consejero que pueda ofrecerte apoyo y herramientas para gestionar tus emociones de manera saludable. Reconocer que necesitas ayuda es un paso valiente y positivo hacia la mejora de tu salud mental.",

    "Es importante que busques ayuda de un profesional para abordar tus emociones y bienestar mental. Este resultado sugiere que podrías estar enfrentando desafíos significativos que merecen atención especializada. Si has sentido que tu salud mental se ve comprometida o que tus emociones son abrumadoras, buscar la ayuda de un profesional es esencial. No hay vergüenza en pedir apoyo; los profesionales de la salud mental están capacitados para ayudarte a explorar tus sentimientos y desarrollar estrategias efectivas para mejorar tu bienestar. Priorizar tu salud mental es un signo de fortaleza."
];

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

const POINTS_PER_QUESTION = 50;
const COMPLETION_BONUS = 200;

export default function Test({ onCompleted }: { onCompleted?: (newScore: number) => void }): JSX.Element {
  const [actualQuestion, setActualQuestion] = useState<number>(0);
  const [testScore, setTestScore] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hasShownResult, setHasShownResult] = useState<boolean>(false);

  const oneQuestion = 100 / questions.length;

  useEffect(() => {
    UserDataManager.visitActivity(ACTIVITY_TITLE);
  }, []);

  function handleAnswerSubmit(answerScore: 1 | 2 | 3 | 4): void {
    const newTestScore = testScore + answerScore;
    setTestScore(newTestScore);
    setPercentage((previous) => previous + oneQuestion);

    const current = UserDataManager.loadUserData();
    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + POINTS_PER_QUESTION
      },
      progress: {
        ...current.progress,
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
    UserDataManager.saveUserData(updatedData);
    onCompleted?.(updatedData.game.totalScore);

    if (actualQuestion === questions.length - 1) {
      setIsFinished(true);
    } else {
      setActualQuestion((previous) => previous + 1);
    }
  }

  // Antes esto agregaba ACTIVITY_ID a completedActivities sin fijarse si
  // ya estaba — cada vez que alguien repetía el test quedaba duplicado
  // en la lista. También el ID usado ('SaludMentalTest') no coincidía
  // con el título real del catálogo ("Salud Mental Test").
  useEffect(() => {
    if (isFinished && !hasShownResult) {
      setHasShownResult(true);

      const current = UserDataManager.loadUserData();
      const finalData = {
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
          activityScores: {
            ...current.progress.activityScores,
            [ACTIVITY_TITLE]: (current.progress.activityScores[ACTIVITY_TITLE] || 0) + COMPLETION_BONUS
          }
        }
      };

      UserDataManager.saveUserData(finalData);
      trackEvent('activity_completed', { activity_title: ACTIVITY_TITLE });
      onCompleted?.(finalData.game.totalScore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, hasShownResult]);

  const resetTest = () => {
    setActualQuestion(0);
    setTestScore(0);
    setPercentage(0);
    setIsFinished(false);
    setHasShownResult(false);
  };

  if (isFinished) {
    const totalEarned = POINTS_PER_QUESTION * questions.length + COMPLETION_BONUS;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: `${ACCENT}15` }}
        >
          <IconHeartHandshake className="w-8 h-8" style={{ color: ACCENT }} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Resultado</h2>
        <p className="text-gray-600 leading-relaxed mb-6 max-w-xl mx-auto">
          {results[calculateImportance(testScore)]}
        </p>

        <div className="rounded-xl p-4 mb-8 max-w-xs mx-auto" style={{ backgroundColor: `${ACCENT}0D` }}>
          <p className="font-semibold text-sm mb-1" style={{ color: ACCENT }}>¡Puntos ganados!</p>
          <p className="text-xs text-gray-500">+{POINTS_PER_QUESTION * questions.length} por responder preguntas</p>
          <p className="text-xs text-gray-500">+{COMPLETION_BONUS} por completar el test</p>
          <p className="font-semibold text-sm mt-1" style={{ color: ACCENT }}>Total: +{totalEarned} puntos</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetTest}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-full font-semibold hover:opacity-90 transition-colors"
            style={{ backgroundColor: ACCENT }}
          >
            <IconRefresh className="w-4.5 h-4.5" />
            Volver a empezar
          </button>
          <a
            href="/literatura"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
          >
            <IconBooks className="w-4.5 h-4.5" />
            Ir a Literatura
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-colors"
          >
            <IconHome className="w-4.5 h-4.5" />
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Progreso</span>
          <span className="text-sm font-medium text-gray-600">{Math.round(percentage)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${percentage}%`, backgroundColor: ACCENT }}
          />
        </div>
      </div>

      <div key={`question-${questions[actualQuestion]}`} className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${ACCENT}15` }}
          >
            <span className="font-bold text-sm" style={{ color: ACCENT }}>
              {actualQuestion + 1}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Pregunta {actualQuestion + 1} de {questions.length}</p>
            <p className="text-sm text-gray-500">Progreso del cuestionario</p>
          </div>
        </div>

        <div className="mb-8 p-6 rounded-xl border" style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}>
          <p className="text-lg text-gray-800 font-medium leading-relaxed">
            {questions[actualQuestion]}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-600 mb-4">¿Cuál es tu respuesta?</p>
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
                py-3 px-4 rounded-xl border-2 font-medium text-gray-800
                transition-all duration-200
                ${answer.color}
                hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
              `}
            >
              {answer.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}