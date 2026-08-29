"use client";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Question } from "./types";
import { IconRefresh, IconTrophy, IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { getActivityById } from '@/lib/activities';
import CertificateRequestForm from '@/components/CertificateRequestForm';

const ACCENT = getActivityById('lecciones')?.color ?? '#1976D2';

// Mismo umbral que ya usa Lecciones.tsx para marcar una lección como
// "completada" (percentage > 65) — el certificado solo se ofrece ahí, no
// antes.
const COMPLETION_THRESHOLD = 65;

type ResultsComponentProps = {
  questions: Question[];
  totalCorrectAnswers: number;
  onRestart: () => void;
  lessonName: string;
  lessonId: string;
};

const ResultsComponent: React.FC<ResultsComponentProps> = ({
  questions = [],
  totalCorrectAnswers = 0,
  onRestart,
  lessonName = "",
  lessonId,
}) => {
  const safeQuestions = questions || [];
  const totalQuestions = safeQuestions.length;
  const incorrectAnswers = totalQuestions - totalCorrectAnswers;

  const pieData = [
    { name: 'Correctas', value: Math.max(totalCorrectAnswers, 0) },
    { name: 'Incorrectas', value: Math.max(incorrectAnswers, 0) },
  ];

  const COLORS = ['#10B981', '#EF4444'];

  const incorrectQuestions = safeQuestions.filter(
    (q) => q && q.userAnswer !== q.correctAnswer
  );

  const correctPercentage = totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0;

  // Antes acá había un useEffect que escribía
  // `localStorage.setItem(lessonName, ...)` — la misma clave suelta
  // ("Pubertad", "Sexualidad"...) que también usa Completapalabras para
  // SUS lecciones, y que ya sacamos de Lecciones.tsx y lesson.tsx. Ese
  // guardado además era redundante: Lecciones.tsx ya persiste el
  // porcentaje real (vía onLessonComplete) en cuanto se llega a esta
  // pantalla. Se quitó por completo.

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
        <div className="h-2" style={{ backgroundColor: ACCENT }}></div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: ACCENT }}>
              <IconTrophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Resultados de la lección
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {lessonName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incorrect Questions Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <IconAlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Preguntas para revisar
              </h3>
            </div>

            {incorrectQuestions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {incorrectQuestions.map((question, index) => (
                  <div
                    key={index}
                    className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-4"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {question?.question || 'Pregunta sin texto'}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Respuesta correcta:</span>
                      {question?.correctAnswer ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <IconCheck size={16} />
                          Verdadero
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <IconX size={16} />
                          Falso
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-xl p-6 text-center">
                <IconCheck className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-green-800 dark:text-green-300 font-medium">
                  ¡Excelente! Respondiste todas las preguntas correctamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chart and Stats Section */}
        <div className="space-y-6">
          {/* Stats card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ color: ACCENT }}>{totalQuestions}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{totalCorrectAnswers}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Correctas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{incorrectAnswers}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Incorrectas</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progreso</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{correctPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                  style={{ width: `${correctPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Performance message */}
            <div className={`rounded-xl p-4 ${
              correctPercentage >= 80
                ? 'bg-green-50 border border-green-200'
                : correctPercentage >= 60
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                correctPercentage >= 80
                  ? 'text-green-800'
                  : correctPercentage >= 60
                  ? 'text-yellow-800'
                  : 'text-red-800'
              }`}>
                {correctPercentage >= 80
                  ? '¡Excelente trabajo! Dominás el tema.'
                  : correctPercentage >= 60
                  ? 'Buen trabajo. Seguí practicando.'
                  : 'Revisá el contenido y volvé a intentarlo.'}
              </p>
            </div>

            {/* Certificado — solo si llegó al umbral de "completada", igual
                que el resto de la app (Lecciones.tsx usa el mismo > 65). */}
            {correctPercentage > COMPLETION_THRESHOLD && (
              <div className="mt-4">
                <CertificateRequestForm
                  accent={ACCENT}
                  buildPayload={(name) => ({
                    name,
                    kind: 'leccion',
                    lessonId,
                    // El servidor recalcula el % real contra `lecciones/{id}`
                    // en Firestore a partir de esto — nunca confía en un
                    // porcentaje ya calculado acá.
                    answeredQuestions: questions.map((q) => ({ question: q.question, userAnswer: q.userAnswer }))
                  })}
                />
              </div>
            )}
          </div>

          {/* Chart card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Distribución de respuestas
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Restart button */}
          <button
            onClick={onRestart}
            className="w-full px-6 py-3 text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            <IconRefresh size={20} />
            <span>Reiniciar lección</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsComponent;
