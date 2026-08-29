'use client';

import { useEffect, useState } from 'react';
import { IconArrowRight, IconRefresh, IconHeartHandshake, IconCircleCheck } from '@tabler/icons-react';
import GameStatusBar from '@/components/GameStatusBar';
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';
import { SCENARIOS, CLOSING_MESSAGE, type LightColor } from '../data/scenarios';

const ACTIVITY = getActivityById('semaforo');
const ACTIVITY_ID = ACTIVITY?.title ?? 'Semáforo del Cuidado';
const ACCENT = ACTIVITY?.color ?? '#FBC02D';

// Puntos por participar, no por "acertar" — acá no hay respuesta
// incorrecta, cada elección abre a la misma explicación (ver
// scenarios.ts). Mismo criterio que ya usa Literatura con sus cuentos.
const POINTS_PER_SCENARIO = 15;

// El feedback usa clases de Tailwind con variante `dark:` (en vez de los
// hex fijos que sí se pueden usar en botones/acentos) porque acá el color
// es el FONDO de un bloque de texto largo — un hex fijo se ve bien en claro
// pero en oscuro queda un fondo clarito con texto clarito encima, casi
// ilegible.
const LIGHTS: Array<{
  value: LightColor;
  label: string;
  emoji: string;
  textClass: string;
  boxClass: string;
}> = [
  {
    value: 'verde',
    label: 'Está bien',
    emoji: '🟢',
    textClass: 'text-green-700 dark:text-green-400',
    boxClass: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900',
  },
  {
    value: 'amarillo',
    label: 'Tengo dudas',
    emoji: '🟡',
    textClass: 'text-amber-700 dark:text-amber-400',
    boxClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
  },
  {
    value: 'rojo',
    label: 'Necesito pedir ayuda',
    emoji: '🔴',
    textClass: 'text-red-700 dark:text-red-400',
    boxClass: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
  },
];

export default function SemaforoDelCuidado(): JSX.Element {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<LightColor | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    UserDataManager.visitActivity(ACTIVITY_ID);
  }, []);

  const scenario = SCENARIOS[index];
  const isLastScenario = index === SCENARIOS.length - 1;
  const referenceLight = LIGHTS.find((l) => l.value === scenario.light) ?? LIGHTS[0];

  const handleSelect = (light: LightColor): void => {
    if (selected !== null) return;
    setSelected(light);

    const newSessionScore = sessionScore + POINTS_PER_SCENARIO;
    setSessionScore(newSessionScore);

    // Carga fresca en vez de confiar en el `score` del closure — evita
    // perder puntos si por algún motivo esto se dispara dos veces seguidas.
    const current = UserDataManager.loadUserData();
    const updated = {
      ...current,
      game: { ...current.game, totalScore: current.game.totalScore + POINTS_PER_SCENARIO },
    };
    UserDataManager.saveUserData(updated);
    setScore(updated.game.totalScore);
  };

  const handleNext = (): void => {
    if (!isLastScenario) {
      setIndex((prev) => prev + 1);
      setSelected(null);
      return;
    }

    setIsComplete(true);
    const current = UserDataManager.loadUserData();
    const alreadyCompleted = current.progress.completedActivities.includes(ACTIVITY_ID);
    const updated = {
      ...current,
      progress: {
        ...current.progress,
        completedActivities: alreadyCompleted
          ? current.progress.completedActivities
          : [...current.progress.completedActivities, ACTIVITY_ID],
        activityScores: {
          ...current.progress.activityScores,
          // `sessionScore` ya incluye los puntos de ESTA situación: se
          // suma dentro de `handleSelect`, que siempre corre antes que
          // este handler (el botón "Terminar" no aparece hasta elegir un
          // semáforo).
          [ACTIVITY_ID]: Math.max(current.progress.activityScores[ACTIVITY_ID] || 0, sessionScore),
        },
        activityTimes: { ...current.progress.activityTimes, [ACTIVITY_ID]: new Date().toISOString() },
      },
    };
    UserDataManager.saveUserData(updated);
    if (!alreadyCompleted) {
      trackEvent('activity_completed', { activity_id: ACTIVITY_ID });
    }
  };

  const handleRestart = (): void => {
    setIndex(0);
    setSelected(null);
    setIsComplete(false);
    setSessionScore(0);
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900">
      <GameStatusBar
        title="Semáforo del Cuidado"
        score={score}
        lives={lives}
        level={index + 1}
        activityName={ACTIVITY_ID}
      />

      <div className="max-w-2xl mx-auto px-4 py-8 pt-24">
        {!isComplete ? (
          <>
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {SCENARIOS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8' : 'w-4'} ${i > index ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  style={i <= index ? { backgroundColor: ACCENT } : undefined}
                />
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
                Situación {index + 1} de {SCENARIOS.length}
              </p>
              <p className="text-lg md:text-xl text-gray-800 dark:text-gray-100 leading-relaxed mb-8">
                {scenario.text}
              </p>

              {selected === null ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LIGHTS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`flex flex-col items-center gap-2 px-4 py-5 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-current transition-all ${option.textClass}`}
                    >
                      <span className="text-3xl">{option.emoji}</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{option.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <div className={`rounded-xl p-4 md:p-5 mb-6 border ${referenceLight.boxClass}`}>
                    <p className={`flex items-center gap-2 text-sm font-semibold mb-2 ${referenceLight.textClass}`}>
                      <span className="text-xl">{referenceLight.emoji}</span>
                      {referenceLight.label}
                    </p>
                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-200 leading-relaxed">
                      {scenario.feedback}
                    </p>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white rounded-full font-semibold hover:opacity-90 transition-colors"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {isLastScenario ? 'Terminar' : 'Siguiente situación'}
                    <IconArrowRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${ACCENT}20` }}>
              <IconHeartHandshake size={32} style={{ color: ACCENT }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              ¡Recorriste todas las situaciones!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto mb-6">
              {CLOSING_MESSAGE}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
              <IconCircleCheck size={18} className="text-green-600" />
              <span>Sumaste {sessionScore} puntos esta vez</span>
            </div>
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-full font-semibold hover:opacity-90 transition-colors"
              style={{ backgroundColor: ACCENT }}
            >
              <IconRefresh size={18} />
              Volver a recorrerlo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
