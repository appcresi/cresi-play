"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { IconCircleCheck, IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';
import { questions } from '../utils/questions';
import UserDataManager from '@/lib/userDataManager';
import { getActivityById } from '@/lib/activities';

// Antes esto era el string suelto 'ChatSimulator' — no coincidía con el
// título real de la actividad en el catálogo ("Simulador Grooming"), así
// que el resto de la app (Features, ClassroomDesk, TeacherDashboard) nunca
// lo reconocía como completado, sin importar cuántas veces lo jugaran.
const ACTIVITY = getActivityById('simulador');
const ACTIVITY_ID = ACTIVITY?.title ?? 'Simulador Grooming';
const ACCENT = ACTIVITY?.color ?? '#F57C00';

interface Answer {
  text: string;
}

const ChatSimulator = () => {
  const [messages, setMessages] = useState<{ content: string; sender: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledAnswers, setShuffledAnswers] = useState<Answer[]>([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [score, setScore] = useState(0);
  const [isSimulatorComplete, setIsSimulatorComplete] = useState(false);
  const [lives, setLives] = useState(3);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', text: '', type: '' });
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (hasLoaded && messages.length === 0) {
      setMessages([
        {
          content: `Hola ${userData.profile.username}, ¿puedes decirme a qué escuela vas? Así sé si vivimos cerca.`,
          sender: 'bot'
        }
      ]);
    }
  }, [hasLoaded, messages.length]);

  useEffect(() => {
    if (hasLoaded) {
      saveUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionScore, lives, isSimulatorComplete]);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    UserDataManager.visitActivity(ACTIVITY_ID);
    setHasLoaded(true);
  };

  const saveUserData = () => {
    const current = UserDataManager.loadUserData();

    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + sessionScore,
        totalLives: lives
      },
      progress: {
        ...current.progress,
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_ID]: Math.max(current.progress.activityScores[ACTIVITY_ID] || 0, sessionScore)
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [ACTIVITY_ID]: new Date().toISOString()
        },
        completedActivities: isSimulatorComplete
          ? Array.from(new Set([...current.progress.completedActivities, ACTIVITY_ID]))
          : current.progress.completedActivities
      }
    };

    UserDataManager.saveUserData(updatedData);
    setScore(updatedData.game.totalScore);
    setUserData(updatedData);
  };

  const checkAndUnlockAchievements = () => {
    const current = UserDataManager.loadUserData();
    const newAchievements = [...current.achievements];
    let hasNewAchievement = false;

    const completeAchievement = newAchievements.find(a => a.id === 'chat_complete');
    if (completeAchievement && !completeAchievement.unlocked && isSimulatorComplete) {
      completeAchievement.unlocked = true;
      completeAchievement.date = new Date().toISOString();
      hasNewAchievement = true;
    }

    const perfectScoreAchievement = newAchievements.find(a => a.id === 'chat_perfect');
    if (perfectScoreAchievement && !perfectScoreAchievement.unlocked && sessionScore >= 140) {
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

  const shuffleArray = (array: Answer[]): Answer[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    const answers = questions[currentQuestionIndex]?.answers || [];
    setShuffledAnswers(shuffleArray(answers));
  }, [currentQuestionIndex]);

  const handleResponse = (response: string) => {
    const correctAnswer = questions[currentQuestionIndex].correctAnswer;
    const isCorrect = response === correctAnswer;
    const newScore = isCorrect ? sessionScore + 10 : sessionScore;
    const newLives = isCorrect ? lives : lives - 1;

    if (isCorrect) {
      setSessionScore(newScore);
      setModalContent({
        title: '¡Correcto!',
        text: `¡Has dado la respuesta correcta! +10 puntos. Puntuación de sesión: ${newScore}`,
        type: 'success'
      });
    } else {
      setLives(newLives);
      setModalContent({
        title: '¡Cuidado!',
        text: 'Podrías estar dando información importante a un desconocido. Mantén siempre tu privacidad.',
        type: 'warning'
      });

      if (newLives <= 0 && userData.game.totalScore >= 200) {
        setShowPurchaseModal(true);
        setShowModal(false);
        return;
      }
    }

    setShowModal(true);
    setMessages((prev) => [...prev, { content: response, sender: 'user' }]);

    setTimeout(() => {
      const nextQuestionIndex = currentQuestionIndex + 1;

      if (nextQuestionIndex < questions.length && newLives > 0) {
        setCurrentQuestionIndex(nextQuestionIndex);
        setMessages((prev) => [
          ...prev,
          { content: questions[nextQuestionIndex].question, sender: 'bot' }
        ]);
      } else {
        setIsSimulatorComplete(true);
        checkAndUnlockAchievements();
        const finalMessage = `Gracias por completar el simulador, ${userData.profile.username}. Recuerda: tu seguridad en línea es importante. Puntuación de sesión: ${newScore} puntos.`;
        setMessages((prev) => [...prev, { content: finalMessage, sender: 'bot' }]);
      }
    }, 2500);
  };

  const resetSimulator = () => {
    setMessages([{
      content: `Hola ${userData.profile.username}, ¿puedes decirme a qué escuela vas? Así sé si vivimos cerca.`,
      sender: 'bot'
    }]);
    setCurrentQuestionIndex(0);
    setSessionScore(0);
    setLives(3);
    setIsSimulatorComplete(false);
  };

  const handlePurchaseLife = () => {
    loadUserData();
    setShowPurchaseModal(false);
  };

  const handleClosePurchaseModal = () => {
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    setUserData(data);

    if (data.game.totalLives < 1) {
      setIsSimulatorComplete(true);
      checkAndUnlockAchievements();
      const finalMessage = `Gracias por completar el simulador, ${data.profile.username}. Recuerda: tu seguridad en línea es importante. Puntuación de sesión: ${sessionScore} puntos.`;
      setMessages((prev) => [...prev, { content: finalMessage, sender: 'bot' }]);
    }

    setShowPurchaseModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GameStatusBar
        title="Simulador de Chat Seguro"
        score={score}
        lives={lives}
        level={currentQuestionIndex + 1}
      />

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onPurchase={handlePurchaseLife}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
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
                      className={`px-4 py-2 rounded-2xl ${isUser ? 'text-white' : 'bg-gray-100 text-gray-800'}`}
                      style={isUser ? { backgroundColor: ACCENT } : undefined}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Área de respuestas */}
          {!isSimulatorComplete ? (
            <div className="border-t border-gray-100 p-6 bg-gray-50">
              <p className="text-sm text-gray-500 mb-4">Selecciona tu respuesta:</p>
              <div className="space-y-3">
                {shuffledAnswers.map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => handleResponse(answer.text)}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-start">
                      <span className="shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm text-gray-800">{answer.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 p-6 text-center" style={{ backgroundColor: `${ACCENT}0D` }}>
              <div className="mb-4">
                <IconCircleCheck className="w-14 h-14 mx-auto" style={{ color: ACCENT }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Simulador Completado!</h3>
              <p className="text-gray-600 mb-2">Puntuación de sesión: {sessionScore} puntos</p>
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
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full p-6">
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
            <h3 className="text-lg font-bold text-center text-gray-900 mb-1.5">{modalContent.title}</h3>
            <p className="text-center text-gray-500 text-sm mb-6">{modalContent.text}</p>
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