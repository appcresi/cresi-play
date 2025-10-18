"use client";
import React, { useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Question } from "./types";
import { IconRefresh, IconTrophy, IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';

type ResultsComponentProps = {
  questions: Question[];
  totalCorrectAnswers: number;
  onRestart: () => void;
  lessonName: string;
};

const ResultsComponent: React.FC<ResultsComponentProps> = ({
  questions = [],
  totalCorrectAnswers = 0,
  onRestart,
  lessonName = "",
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

  useEffect(() => {
    localStorage.setItem(lessonName, correctPercentage.toFixed(2));
  }, [correctPercentage, lessonName]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <IconTrophy className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Resultados de la Lección
            </h2>
          </div>
          <p className="text-lg text-gray-600 ml-13">
            {lessonName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incorrect Questions Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <IconAlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Preguntas para revisar
              </h3>
            </div>
            
            {incorrectQuestions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {incorrectQuestions.map((question, index) => (
                  <div 
                    key={index} 
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {question?.question || 'Pregunta sin texto'}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Respuesta correcta:</span>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <IconCheck className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-green-800 font-medium">
                  ¡Excelente! Respondiste todas las preguntas correctamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chart and Stats Section */}
        <div className="space-y-6">
          {/* Stats card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{totalQuestions}</p>
                <p className="text-sm text-gray-600 mt-1">Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{totalCorrectAnswers}</p>
                <p className="text-sm text-gray-600 mt-1">Correctas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{incorrectAnswers}</p>
                <p className="text-sm text-gray-600 mt-1">Incorrectas</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progreso</span>
                <span className="text-sm font-bold text-gray-900">{correctPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                  style={{ width: `${correctPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Performance message */}
            <div className={`rounded-lg p-4 ${
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
          </div>

          {/* Chart card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
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
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
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
