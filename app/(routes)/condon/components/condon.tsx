"use client";
import React, { useState, useEffect } from 'react';
import {
  IconCircleCheck,
  IconCircleX,
  IconRefresh,
  IconTrophy,
  IconAlertTriangle,
  IconStarFilled,
  IconMoodPuzzled,
} from '@tabler/icons-react';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';
import { stepsData, type Step } from '../data/questions';

const ACTIVITY = getActivityById('condon');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Prevención';
const ACCENT = ACTIVITY?.color ?? '#D32F2F';
const POINTS_PER_CORRECT = 50;

function shuffleOptions<T>(options: T[]): T[] {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildShuffledSteps(): Step[] {
  return stepsData.map(step => ({ ...step, options: shuffleOptions(step.options) }));
}

export default function ComicPoneloSimulator() {
  // Arranca con el orden original (determinístico) para que el HTML del
  // servidor coincida con el primer render del cliente — el mezclado con
  // Math.random() da un resultado distinto en cada uno y rompe la
  // hidratación. El mezclado real pasa recién en el useEffect de abajo,
  // que solo corre en el cliente después de montar.
  const [steps, setSteps] = useState<Step[]>(stepsData);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    loadUserData();
    setSteps(buildShuffledSteps());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    UserDataManager.visitActivity(ACTIVITY_TITLE);
  };

  const saveUserData = (updatedData: typeof userData) => {
    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
    setScore(updatedData.game.totalScore);
    setLives(updatedData.game.totalLives);
  };

  const handleOptionClick = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const isCorrect = steps[currentStep].options[optionIndex].correct;

    if (isCorrect) {
      const updatedData = {
        ...userData,
        game: {
          ...userData.game,
          totalScore: userData.game.totalScore + POINTS_PER_CORRECT
        },
        progress: {
          ...userData.progress,
          activityScores: {
            ...userData.progress.activityScores,
            [ACTIVITY_TITLE]: (userData.progress.activityScores[ACTIVITY_TITLE] || 0) + POINTS_PER_CORRECT
          },
          activityTimes: {
            ...userData.progress.activityTimes,
            [ACTIVITY_TITLE]: new Date().toISOString()
          }
        }
      };
      saveUserData(updatedData);
    } else {
      const newLives = Math.max(0, userData.game.totalLives - 1);
      const updatedData = {
        ...userData,
        game: {
          ...userData.game,
          totalLives: newLives
        },
        progress: {
          ...userData.progress,
          activityTimes: {
            ...userData.progress.activityTimes,
            [ACTIVITY_TITLE]: new Date().toISOString()
          }
        }
      };
      saveUserData(updatedData);

      if (newLives === 0) {
        setShowPurchaseModal(true);
      }
    }

    setGameKey(prev => prev + 1);
  };

  const handleNext = () => {
    if (userData.game.totalLives === 0) {
      setShowPurchaseModal(true);
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setCompleted(true);
      // Antes esto nunca pasaba: el juego no marcaba la actividad como
      // completada en ningún lado, sin importar cuántas veces lo terminaras.
      const current = UserDataManager.loadUserData();
      if (!current.progress.completedActivities.includes(ACTIVITY_TITLE)) {
        current.progress.completedActivities.push(ACTIVITY_TITLE);
        current.progress.activityTimes[ACTIVITY_TITLE] = new Date().toISOString();
        UserDataManager.saveUserData(current);
        setUserData(current);
        trackEvent('activity_completed', { activity_title: ACTIVITY_TITLE });
      }
    }
  };

  /**
   * "Intentar de nuevo" reinicia SOLO esta partida (vuelve a la pregunta 1
   * y remezcla las opciones). Antes, además, ponía `totalScore` en 0 —
   * borrando el puntaje acumulado de TODA la cuenta, no solo el de este
   * juego — y regalaba 3 vidas gratis, algo que en el resto de la app
   * solo se consigue comprando con puntos. Ninguna de las dos cosas
   * debería pasar acá.
   */
  const handleRestart = () => {
    setSteps(buildShuffledSteps());
    setCurrentStep(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setCompleted(false);
    setGameKey(prev => prev + 1);
    loadUserData();
  };

  const handlePurchaseSuccess = () => {
    loadUserData();
    setShowPurchaseModal(false);
  };

  const getScoreMessage = () => {
    const percentage = (score / (steps.length * POINTS_PER_CORRECT)) * 100;
    if (percentage === 100) return "¡SUPERHÉROE/A!";
    if (percentage >= 80) return "¡CASI PERFECTO!";
    if (percentage >= 60) return "¡BUEN TRABAJO!";
    return "¡A ENTRENAR MÁS!";
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-900">
        <GameStatusBar
          key={gameKey}
          title="Ponelo Bien"
          score={score}
          lives={lives}
          level={1}
          currentQuestion={steps.length}
          totalQuestions={steps.length}
        />

        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-8">
            <div className="flex items-center justify-center mb-6">
              <IconTrophy className="w-14 h-14 text-yellow-500" />
            </div>

            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-3">
              ¡Misión cumplida!
            </h2>

            <p className="text-center text-lg text-gray-600 dark:text-gray-400 mb-8">
              {getScoreMessage()}
            </p>

            <div className="rounded-xl border-l-4 p-6 mb-6" style={{ backgroundColor: `${ACCENT}0D`, borderColor: ACCENT }}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Tu puntuación</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold" style={{ color: ACCENT }}>{score}</span>
                <span className="text-gray-500 dark:text-gray-400">puntos</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {Math.round((score / (steps.length * POINTS_PER_CORRECT)) * 100)}% de respuestas correctas
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-400 dark:border-amber-700 rounded-xl p-6 mb-8">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <IconAlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                Recordatorios importantes
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {[
                  'Usar preservativo en toda relación sexual',
                  'Verificar fecha de vencimiento',
                  'Conservar en lugar fresco y seco',
                  'Usar uno nuevo en cada relación',
                  'Combinar con otros métodos anticonceptivos',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <IconStarFilled className="w-3.5 h-3.5 mt-0.5 text-amber-500 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 text-white px-6 py-2.5 rounded-full font-semibold hover:opacity-90 transition-colors"
                style={{ backgroundColor: ACCENT }}
              >
                <IconRefresh className="w-4.5 h-4.5" />
                Intentar de nuevo
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const selectedOptionData = selectedOption !== null ? currentStepData.options[selectedOption] : null;

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900">
      <GameStatusBar
        key={gameKey}
        title="Ponelo Bien"
        score={score}
        lives={lives}
        level={1}
        currentQuestion={currentStep + 1}
        totalQuestions={steps.length}
      />

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchaseSuccess}
        itemName="vida extra"
        description="¿Comprar una vida extra para continuar?"
      />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 text-white" style={{ background: `linear-gradient(to right, ${ACCENT}, ${ACCENT}CC)` }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <IconMoodPuzzled className="w-5 h-5" />
                Pregunta {currentStep + 1} de {steps.length}
              </h2>
              <span className="bg-white px-3 py-1 rounded-full font-bold text-xs" style={{ color: ACCENT }}>
                {lives} {lives === 1 ? 'vida' : 'vidas'}
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentStepData.question}
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              {currentStepData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showFeedback && handleOptionClick(index)}
                  disabled={showFeedback || lives === 0}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    selectedOption === index
                      ? option.correct
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : showFeedback
                        ? option.correct
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                        : lives === 0
                          ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                  }`}
                >
                  <span className="text-2xl shrink-0">{option.emoji}</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium flex-1 text-sm">{option.text}</span>
                  {showFeedback && selectedOption === index && (
                    <div className="shrink-0">
                      {option.correct ? (
                        <IconCircleCheck className="w-5 h-5 text-green-600" />
                      ) : (
                        <IconCircleX className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {showFeedback && selectedOptionData && (
              <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
                selectedOptionData.correct
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="shrink-0">
                  {selectedOptionData.correct ? (
                    <IconCircleCheck className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <IconCircleX className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                </div>
                <p className={`text-sm font-medium ${selectedOptionData.correct ? 'text-green-800' : 'text-red-800'}`}>
                  {selectedOptionData.feedback}
                </p>
              </div>
            )}

            {showFeedback && (
              <div className="flex justify-center">
                {lives > 0 ? (
                  <button
                    onClick={handleNext}
                    className="text-white px-6 py-2.5 rounded-full font-semibold hover:opacity-90 transition-colors"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {currentStep === steps.length - 1 ? 'Ver resultados' : 'Siguiente'}
                  </button>
                ) : (
                  <div className="w-full">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-4">
                      <p className="text-red-800 font-semibold text-sm">Sin vidas disponibles</p>
                      <p className="text-red-600 text-xs mt-1">Comprá una vida para continuar</p>
                    </div>
                    <button
                      onClick={() => setShowPurchaseModal(true)}
                      className="w-full text-white px-6 py-2.5 rounded-full font-semibold hover:opacity-90 transition-colors"
                      style={{ backgroundColor: ACCENT }}
                    >
                      Comprar vida
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}