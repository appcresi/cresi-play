"use client";
import { useState, useEffect } from 'react';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';
import { questions } from '../utils/questions';

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

interface Answer {
  text: string;
}

const STORAGE_KEY = 'cresi_user_data';
const ACTIVITY_ID = 'chat_simulator';

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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Cargar datos del usuario al inicio
  useEffect(() => {
    loadUserData();
  }, []);

  // Inicializar primer mensaje cuando userData esté disponible
  useEffect(() => {
    if (userData && messages.length === 0) {
      setMessages([
        { 
          content: `Hola ${userData.profile.username}, ¿puedes decirme a qué escuela vas? Así sé si vivimos cerca.`, 
          sender: 'bot' 
        }
      ]);
    }
  }, [userData, messages.length]);

  // Guardar datos cuando cambian sessionScore o lives
  useEffect(() => {
    if (userData) {
      saveUserData();
    }
  }, [sessionScore, lives, isSimulatorComplete]);

  const loadUserData = () => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: UserData = JSON.parse(storedData);
        setUserData(data);
        
        // Establecer el score total inicial
        setScore(data.game.totalScore);
        
        // Actualizar última visita a esta actividad
        data.progress.lastVisits[ACTIVITY_ID] = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUserData = () => {
    if (!userData) return;

    try {
      const updatedData: UserData = {
        ...userData,
        game: {
          ...userData.game,
          totalScore: userData.game.totalScore + sessionScore,
          totalLives: lives
        },
        progress: {
          ...userData.progress,
          activityScores: {
            ...userData.progress.activityScores,
            [ACTIVITY_ID]: Math.max(
              userData.progress.activityScores[ACTIVITY_ID] || 0,
              sessionScore
            )
          },
          activityTimes: {
            ...userData.progress.activityTimes,
            [ACTIVITY_ID]: new Date().toISOString()
          },
          completedActivities: isSimulatorComplete
            ? Array.from(new Set([...userData.progress.completedActivities, ACTIVITY_ID]))
            : userData.progress.completedActivities
        }
      };

      // Actualizar score total para el GameStatusBar
      setScore(updatedData.game.totalScore);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const checkAndUnlockAchievements = () => {
    if (!userData) return;

    const newAchievements = [...userData.achievements];
    let hasNewAchievement = false;

    // Logro: Completar el simulador
    const completeAchievement = newAchievements.find(a => a.id === 'chat_complete');
    if (completeAchievement && !completeAchievement.unlocked && isSimulatorComplete) {
      completeAchievement.unlocked = true;
      completeAchievement.date = new Date().toISOString();
      hasNewAchievement = true;
    }

    // Logro: Puntuación perfecta
    const perfectScoreAchievement = newAchievements.find(a => a.id === 'chat_perfect');
    if (perfectScoreAchievement && !perfectScoreAchievement.unlocked && sessionScore >= 140) {
      perfectScoreAchievement.unlocked = true;
      perfectScoreAchievement.date = new Date().toISOString();
      hasNewAchievement = true;
    }

    if (hasNewAchievement) {
      const updatedData = {
        ...userData,
        achievements: newAchievements
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
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
      
      // Si se quedan sin vidas y tienen suficientes puntos, mostrar modal de compra
      if (newLives <= 0 && userData && userData.game.totalScore >= 200) {
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
        const finalMessage = userData 
          ? `Gracias por completar el simulador, ${userData.profile.username}. Recuerda: tu seguridad en línea es importante. Puntuación de sesión: ${newScore} puntos.`
          : `Gracias por completar el simulador. Recuerda: tu seguridad en línea es importante. Puntuación de sesión: ${newScore} puntos.`;
        setMessages((prev) => [
          ...prev,
          { 
            content: finalMessage, 
            sender: 'bot' 
          }
        ]);
      }
    }, 2500);
  };

  const resetSimulator = () => {
    const initialMessage = userData 
      ? `Hola ${userData.profile.username}, ¿puedes decirme a qué escuela vas? Así sé si vivimos cerca.`
      : 'Hola, ¿puedes decirme a qué escuela vas? Así sé si vivimos cerca.';
    
    setMessages([{ content: initialMessage, sender: 'bot' }]);
    setCurrentQuestionIndex(0);
    setSessionScore(0);
    setLives(3);
    setIsSimulatorComplete(false);
  };

  const handlePurchaseLife = () => {
    // El PurchaseModal ya maneja la compra y actualiza UserData
    // Solo necesitamos recargar los datos y continuar el juego
    loadUserData();
    setShowPurchaseModal(false);
  };

  const handleClosePurchaseModal = () => {
    // Recargar datos por si se hizo una compra
    loadUserData();
    
    // Si después de intentar comprar sigue sin vidas, terminar el juego
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const data: UserData = JSON.parse(storedData);
      if (data.game.totalLives < 1) {
        setIsSimulatorComplete(true);
        checkAndUnlockAchievements();
        const finalMessage = userData 
          ? `Gracias por completar el simulador, ${userData.profile.username}. Recuerda: tu seguridad en línea es importante. Puntuación de sesión: ${sessionScore} puntos.`
          : `Gracias por completar el simulador. Recuerda: tu seguridad en línea es importante. Puntuación de sesión: ${sessionScore} puntos.`;
        setMessages((prev) => [
          ...prev,
          { 
            content: finalMessage, 
            sender: 'bot' 
          }
        ]);
      }
    }
    
    setShowPurchaseModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GameStatusBar importado */}
      <GameStatusBar
        title="Simulador de Chat Seguro"
        score={score}
        lives={lives}
        level={currentQuestionIndex + 1}
      />

      {/* Modal de compra de vidas */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onPurchase={handlePurchaseLife}
      />

      {/* Contenedor principal */}
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
       
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Área de mensajes */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-md`}>
                    {isUser && userData ? (
                      <img 
                        src={userData.profile.character.image} 
                        alt="User"
                        className="w-8 h-8 rounded-full ml-2"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${isUser ? 'bg-blue-600 ml-2' : 'bg-gray-600 mr-2'}`}>
                        {isUser ? 'U' : 'B'}
                      </div>
                    )}
                    <div className={`px-4 py-2 rounded-lg ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Área de respuestas */}
          {!isSimulatorComplete ? (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <p className="text-sm text-gray-600 mb-4">Selecciona tu respuesta:</p>
              <div className="space-y-3">
                {shuffledAnswers.map((answer, index) => (
                  <button
                    key={index}
                    onClick={() => handleResponse(answer.text)}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-700 mr-3">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm text-gray-800">{answer.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 p-6 bg-blue-50 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Simulador Completado!</h3>
              <p className="text-gray-600 mb-2">Puntuación de sesión: {sessionScore} puntos</p>
              {userData && userData.progress.activityScores[ACTIVITY_ID] && sessionScore > userData.progress.activityScores[ACTIVITY_ID] && (
                <p className="text-green-600 font-semibold mb-4">¡Nuevo récord personal! 🎉</p>
              )}
              <button
                onClick={resetSimulator}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reiniciar Simulador
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de feedback */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-pulse">
            <div className="flex items-center justify-center mb-4">
              {modalContent.type === 'success' ? (
                <svg className="w-16 h-16 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-16 h-16 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">{modalContent.title}</h3>
            <p className="text-center text-gray-600 mb-6">{modalContent.text}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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