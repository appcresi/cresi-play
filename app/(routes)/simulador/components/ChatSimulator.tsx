"use client";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { IconCircleCheck, IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';
import TypingIndicator from './TypingIndicator';
import { SCENARIOS, type ChatOption, type ChatNode, type ChatScenario } from '../utils/scenarios';
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';

// Antes esto era el string suelto 'ChatSimulator' — no coincidía con el
// título real de la actividad en el catálogo ("Simulador Grooming"), así
// que el resto de la app (Features, ClassroomDesk, TeacherDashboard) nunca
// lo reconocía como completado, sin importar cuántas veces lo jugaran.
const ACTIVITY = getActivityById('simulador');
const ACTIVITY_ID = ACTIVITY?.title ?? 'Simulador Grooming';
const ACCENT = ACTIVITY?.color ?? '#F57C00';

const POINTS_PER_SAFE_ANSWER = 15;
// Máximo posible: 8 escenas × 2 respuestas cada una × 15 puntos.
const MAX_POSSIBLE_SCORE = SCENARIOS.length * 2 * POINTS_PER_SAFE_ANSWER;

const WORD_DELAY_MS = 65;
const THINKING_MIN_MS = 500;
const THINKING_MAX_MS = 900;

const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const ChatSimulator = () => {
  const [messages, setMessages] = useState<{ content: string; sender: string }[]>([]);
  const [currentNode, setCurrentNode] = useState<ChatNode | null>(null);
  const [optionsOrder, setOptionsOrder] = useState<ChatOption[]>([]);
  const [botPhase, setBotPhase] = useState<'idle' | 'thinking' | 'writing'>('idle');
  const [liveText, setLiveText] = useState('');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [score, setScore] = useState(0);
  const [isSimulatorComplete, setIsSimulatorComplete] = useState(false);
  const [lives, setLives] = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', text: '', type: '' });
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Refs para no depender de closures viejas dentro de setTimeout/setInterval
  // (el valor de `scenarioIndex` en React state puede estar desactualizado
  // en el momento en que corre un timer armado varios renders atrás).
  const scenarioIndexRef = useRef(0);
  // Mismo motivo para el puntaje y las vidas: `setSessionScore(sessionScore
  // + 15)` lee el valor de la última vez que el componente renderizó, así
  // que si `handleResponse` se dispara dos veces muy seguido (doble click,
  // o un reintento de click) antes de que React vuelva a renderizar, la
  // segunda suma se calcula sobre el mismo valor viejo y una de las dos
  // se pierde. Estos refs siempre tienen el valor más reciente.
  const sessionScoreRef = useRef(0);
  const livesRef = useRef(3);
  // Evita que se pueda responder dos veces a la misma pregunta mientras la
  // primera respuesta todavía se está procesando.
  const isAnsweringRef = useRef(false);
  const thinkingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const revealIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  // Referencia al final del área de mensajes, para hacer scroll automático
  // cada vez que se suma contenido (mensaje nuevo, indicador de "escribiendo",
  // o texto que se va revelando palabra por palabra) — sin esto, la
  // conversación crece hacia abajo y hay que scrollear manualmente para ver
  // lo último, al revés de un chat real.
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserData();
    return () => {
      if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, botPhase, liveText]);

  useEffect(() => {
    if (hasLoaded && messages.length === 0 && !currentNode) {
      advanceToNode(SCENARIOS[0], SCENARIOS[0].nodes[SCENARIOS[0].startNode]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded]);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    UserDataManager.visitActivity(ACTIVITY_ID);
    setHasLoaded(true);
  };

  // Suma los puntos de UNA respuesta correcta, una sola vez, en el momento
  // en que ocurre. Antes esto vivía en un useEffect que se disparaba cada
  // vez que `sessionScore` cambiaba y volvía a sumar el `sessionScore`
  // COMPLETO (ya acumulado) sobre el total — con 16 respuestas correctas,
  // el puntaje real quedaba sumado muchas veces de más en vez de una.
  const persistCorrectAnswer = (newSessionScore: number) => {
    const current = UserDataManager.loadUserData();
    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + POINTS_PER_SAFE_ANSWER
      },
      progress: {
        ...current.progress,
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_ID]: Math.max(current.progress.activityScores[ACTIVITY_ID] || 0, newSessionScore)
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [ACTIVITY_ID]: new Date().toISOString()
        }
      }
    };
    UserDataManager.saveUserData(updatedData);
    setScore(updatedData.game.totalScore);
    setUserData(updatedData);
  };

  const persistLives = (newLives: number) => {
    const current = UserDataManager.loadUserData();
    const updatedData = { ...current, game: { ...current.game, totalLives: newLives } };
    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
  };

  // Se llama únicamente desde `finishSimulator`, que ya se aseguró de que
  // el simulador esté completo — por eso acá se lo trata como un hecho, en
  // vez de volver a leer el estado `isSimulatorComplete` (que, por venir de
  // una cadena vieja de setTimeout, podría todavía reflejar el valor de
  // antes de terminar). Lo mismo con el puntaje: se usa la referencia
  // siempre actualizada en vez del estado, que tiene el mismo problema.
  const checkAndUnlockAchievements = () => {
    const current = UserDataManager.loadUserData();
    const newAchievements = [...current.achievements];
    let hasNewAchievement = false;

    const completeAchievement = newAchievements.find(a => a.id === 'chat_complete');
    if (completeAchievement && !completeAchievement.unlocked) {
      completeAchievement.unlocked = true;
      completeAchievement.date = new Date().toISOString();
      hasNewAchievement = true;
    }

    const perfectScoreAchievement = newAchievements.find(a => a.id === 'chat_perfect');
    if (perfectScoreAchievement && !perfectScoreAchievement.unlocked && sessionScoreRef.current >= MAX_POSSIBLE_SCORE) {
      perfectScoreAchievement.unlocked = true;
      perfectScoreAchievement.date = new Date().toISOString();
      hasNewAchievement = true;
    }

    if (hasNewAchievement) {
      const updatedData = { ...current, achievements: newAchievements };
      UserDataManager.saveUserData(updatedData);
      setUserData(updatedData);
    }
  };

  // Simula que el desconocido está escribiendo: primero un pequeño silencio
  // (los tres puntitos), después el mensaje se va completando palabra por
  // palabra en la burbuja — recién ahí aparecen las respuestas para elegir.
  // Antes el mensaje siguiente aparecía entero e instantáneo, sin ninguna
  // sensación de estar "esperando" a que la otra persona responda.
  const advanceToNode = (scenario: ChatScenario, node: ChatNode) => {
    setCurrentNode(node);
    // Ojo: las opciones se muestran recién cuando el mensaje termina de
    // "escribirse" (más abajo) — si se setean acá aparecen de entrada,
    // aunque deshabilitadas, arruinando el efecto de estar esperando.
    setOptionsOrder([]);
    setLiveText('');

    // Los nodos de cierre de escena no tienen mensaje propio — se pasa
    // directo a la siguiente escena sin mostrar nada.
    if (!node.message) {
      goToNextScenarioOrFinish(scenario);
      return;
    }

    setBotPhase('thinking');
    const thinkDelay = THINKING_MIN_MS + Math.random() * (THINKING_MAX_MS - THINKING_MIN_MS);

    thinkingTimeoutRef.current = setTimeout(() => {
      setBotPhase('writing');
      const words = node.message.split(' ');
      let wordIndex = 0;

      revealIntervalRef.current = setInterval(() => {
        wordIndex++;
        setLiveText(words.slice(0, wordIndex).join(' '));

        if (wordIndex >= words.length) {
          if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
          setMessages((prev) => [...prev, { content: node.message, sender: 'bot' }]);
          setBotPhase('idle');
          setLiveText('');

          if (node.options.length === 0) {
            advanceTimeoutRef.current = setTimeout(() => goToNextScenarioOrFinish(scenario), 900);
          } else {
            isAnsweringRef.current = false;
            setOptionsOrder(shuffleArray(node.options));
          }
        }
      }, WORD_DELAY_MS);
    }, thinkDelay);
  };

  const goToNextScenarioOrFinish = (finishedScenario: ChatScenario) => {
    const finishedIndex = SCENARIOS.findIndex((s) => s.id === finishedScenario.id);
    const nextIndex = finishedIndex + 1;

    if (nextIndex < SCENARIOS.length) {
      scenarioIndexRef.current = nextIndex;
      setScenarioIndex(nextIndex);
      advanceToNode(SCENARIOS[nextIndex], SCENARIOS[nextIndex].nodes[SCENARIOS[nextIndex].startNode]);
    } else {
      finishSimulator();
    }
  };

  const finishSimulator = () => {
    setIsSimulatorComplete(true);
    checkAndUnlockAchievements();

    const current = UserDataManager.loadUserData();
    if (!current.progress.completedActivities.includes(ACTIVITY_ID)) {
      const updatedData = {
        ...current,
        progress: {
          ...current.progress,
          completedActivities: [...current.progress.completedActivities, ACTIVITY_ID]
        }
      };
      UserDataManager.saveUserData(updatedData);
      setUserData(updatedData);
      trackEvent('activity_completed', { activity_id: ACTIVITY_ID });
    }

    setMessages((prev) => [
      ...prev,
      {
        content: `Gracias por completar el simulador, ${userData.profile.username}. Recuerda: tu seguridad en línea es importante. Puntuación de sesión: ${sessionScoreRef.current} puntos.`,
        sender: 'bot'
      }
    ]);
  };

  const handleResponse = (option: ChatOption) => {
    if (isAnsweringRef.current) return;
    isAnsweringRef.current = true;

    setMessages((prev) => [...prev, { content: option.text, sender: 'user' }]);
    setOptionsOrder([]);

    const isCorrect = option.outcome === 'safe';

    setModalContent({
      title: option.feedbackTitle,
      text: option.feedbackText,
      type: isCorrect ? 'success' : 'warning'
    });
    setShowModal(true);

    if (isCorrect) {
      const newScore = sessionScoreRef.current + POINTS_PER_SAFE_ANSWER;
      sessionScoreRef.current = newScore;
      setSessionScore(newScore);
      persistCorrectAnswer(newScore);

      const scenario = SCENARIOS[scenarioIndexRef.current];
      advanceTimeoutRef.current = setTimeout(() => {
        advanceToNode(scenario, scenario.nodes[option.next]);
      }, 1800);
      return;
    }

    const newLives = livesRef.current - 1;
    livesRef.current = newLives;
    setLives(newLives);
    persistLives(newLives);

    if (newLives <= 0) {
      if (userData.game.totalScore >= 200) {
        setShowPurchaseModal(true);
        setShowModal(false);
        return;
      }
      advanceTimeoutRef.current = setTimeout(() => {
        finishSimulator();
      }, 1800);
      return;
    }

    const scenario = SCENARIOS[scenarioIndexRef.current];
    advanceTimeoutRef.current = setTimeout(() => {
      advanceToNode(scenario, scenario.nodes[option.next]);
    }, 1800);
  };

  const resetSimulator = () => {
    if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
    if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);

    setMessages([]);
    setCurrentNode(null);
    setOptionsOrder([]);
    setBotPhase('idle');
    setLiveText('');
    scenarioIndexRef.current = 0;
    setScenarioIndex(0);
    sessionScoreRef.current = 0;
    setSessionScore(0);
    livesRef.current = 3;
    setLives(3);
    isAnsweringRef.current = false;
    setIsSimulatorComplete(false);

    advanceToNode(SCENARIOS[0], SCENARIOS[0].nodes[SCENARIOS[0].startNode]);
  };

  const handlePurchaseLife = () => {
    loadUserData();
    setShowPurchaseModal(false);
  };

  const handleClosePurchaseModal = () => {
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    livesRef.current = data.game.totalLives;
    setLives(data.game.totalLives);
    setUserData(data);

    if (data.game.totalLives < 1) {
      finishSimulator();
    } else if (currentNode) {
      // Recuperó una vida: puede volver a intentar la misma respuesta que
      // lo dejó sin vidas, en vez de perder el progreso de la escena.
      isAnsweringRef.current = false;
      setOptionsOrder(shuffleArray(currentNode.options));
    }

    setShowPurchaseModal(false);
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900">
      <GameStatusBar
        title="Simulador de Chat Seguro"
        score={score}
        lives={lives}
        level={scenarioIndex + 1}
      />

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onPurchase={handlePurchaseLife}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Área de mensajes */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-md`}>
                    {isUser && userData.profile.character.image ? (
                      <Image
                        src={userData.profile.character.image}
                        alt="User"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full ml-2 object-cover"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                        style={{ backgroundColor: isUser ? ACCENT : '#9CA3AF' }}
                      >
                        {isUser ? 'U' : 'B'}
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${isUser ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
                      style={isUser ? { backgroundColor: ACCENT } : undefined}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {botPhase === 'thinking' && <TypingIndicator />}

            {botPhase === 'writing' && (
              <div className="flex justify-start">
                <div className="flex flex-row items-end space-x-2 max-w-md">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 bg-gray-400">
                    B
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <p className="text-sm">{liveText}</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Área de respuestas */}
          {!isSimulatorComplete ? (
            <div className="border-t border-gray-100 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/40">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {botPhase !== 'idle' || optionsOrder.length === 0 ? 'Esperando respuesta...' : 'Selecciona tu respuesta:'}
              </p>
              <div className="space-y-3">
                {optionsOrder.map((option, index) => (
                  <button
                    key={option.text}
                    onClick={() => handleResponse(option)}
                    disabled={botPhase !== 'idle'}
                    className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start">
                      <span className="shrink-0 w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm text-gray-800 dark:text-gray-200">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 dark:border-gray-700 p-6 text-center" style={{ backgroundColor: `${ACCENT}0D` }}>
              <div className="mb-4">
                <IconCircleCheck className="w-14 h-14 mx-auto" style={{ color: ACCENT }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">¡Simulador Completado!</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">Puntuación de sesión: {sessionScore} puntos</p>
              {userData.progress.activityScores[ACTIVITY_ID] > 0 && sessionScore > userData.progress.activityScores[ACTIVITY_ID] && (
                <p className="text-green-600 font-semibold mb-4">¡Nuevo récord personal! 🎉</p>
              )}
              <button
                onClick={resetSimulator}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-full font-semibold hover:opacity-90 transition-colors"
                style={{ backgroundColor: ACCENT }}
              >
                <IconRefresh className="w-4 h-4" />
                Reiniciar Simulador
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de feedback */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              {modalContent.type === 'success' ? (
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <IconCircleCheck className="w-8 h-8 text-green-600" />
                </div>
              ) : (
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                  <IconAlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 dark:text-gray-100 mb-1.5">{modalContent.title}</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">{modalContent.text}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2.5 text-white rounded-full font-semibold hover:opacity-90 transition-colors"
              style={{ backgroundColor: ACCENT }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSimulator;
