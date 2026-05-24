"use client";
import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, XCircle, RotateCcw, Trophy, AlertTriangle, Zap, Star, ArrowLeft } from 'lucide-react';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';

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

interface Step {
  id: number;
  question: string;
  options: {
    text: string;
    emoji: string;
    correct: boolean;
    feedback: string;
  }[];
}

const STORAGE_KEY = 'cresi_user_data';
const ACTIVITY_ID = 'Ponelo Bien';
const POINTS_PER_CORRECT = 50;

const shuffleOptions = (options: any[]) => {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};


const stepsData: Step[] = [
  {
    id: 1,
    question: "PASO 1: Estás a punto de usar un preservativo. ¿Cuál es la primera verificación importante?",
    options: [
      {
        text: "Revisar la fecha de vencimiento cuidadosamente",
        emoji: "📅",
        correct: true,
        feedback: "Correcto. Verificar la fecha de vencimiento es fundamental. Un preservativo vencido pierde efectividad."
      },
      {
        text: "Abrirlo rápidamente para no perder el momento",
        emoji: "⚡",
        correct: false,
        feedback: "No es recomendable. Siempre hay que verificar la fecha antes de abrir el envase."
      },
      {
        text: "Guardarlo para usar más tarde",
        emoji: "💾",
        correct: false,
        feedback: "Incorrecto. La preparación debe hacerse antes del contacto íntimo."
      }
    ]
  },
  {
    id: 2,
    question: "PASO 2: El preservativo está en buen estado. ¿Cuál es la forma correcta de abrir el envase?",
    options: [
      {
        text: "Con los dedos, cuidadosamente por el borde",
        emoji: "👆",
        correct: true,
        feedback: "Excelente. Usar los dedos evita dañar el material del preservativo."
      },
      {
        text: "Con los dientes para mayor rapidez",
        emoji: "🦷",
        correct: false,
        feedback: "No recomendado. Los dientes pueden hacer pequeños agujeros imperceptibles."
      },
      {
        text: "Con tijeras o cuchillo",
        emoji: "✂️",
        correct: false,
        feedback: "Peligroso. Los objetos cortantes pueden dañar el preservativo."
      }
    ]
  },
  {
    id: 3,
    question: "PASO 3: Tienes el preservativo en tus manos. ¿Qué debes verificar antes de colocarlo?",
    options: [
      {
        text: "Que esté orientado correctamente para desenrollarse",
        emoji: "🔄",
        correct: true,
        feedback: "Perfecto. La orientación correcta permite un desenrollado fácil y seguro."
      },
      {
        text: "Colocarlo inmediatamente sin verificar",
        emoji: "⏰",
        correct: false,
        feedback: "No es seguro. Siempre hay que verificar la orientación primero."
      },
      {
        text: "Inflarlo para verificar que no tenga agujeros",
        emoji: "🎈",
        correct: false,
        feedback: "Incorrecto. Inflarlo puede debilitar el material. Solo verificar visualmente."
      }
    ]
  },
  {
    id: 4,
    question: "PASO 4: El preservativo está correctamente orientado. ¿Qué hacer con la punta antes de colocarlo?",
    options: [
      {
        text: "Presionar la punta para expulsar el aire",
        emoji: "👌",
        correct: true,
        feedback: "Correcto. Eliminar el aire previene que se forme una burbuja que podría romperlo."
      },
      {
        text: "Humedecerlo con agua",
        emoji: "💧",
        correct: false,
        feedback: "Innecesario. Los preservativos ya vienen con lubricante incorporado."
      },
      {
        text: "Colocarlo directamente sin preparación",
        emoji: "➡️",
        correct: false,
        feedback: "No recomendado. Es importante expulsar el aire de la punta primero."
      }
    ]
  },
  {
    id: 5,
    question: "PASO 5: Has presionado la punta correctamente. ¿Cómo completar la colocación?",
    options: [
      {
        text: "Desenrollarlo completamente hasta la base",
        emoji: "📏",
        correct: true,
        feedback: "Excelente. La cobertura completa asegura máxima protección."
      },
      {
        text: "Cubrir solo la parte superior",
        emoji: "🔺",
        correct: false,
        feedback: "Insuficiente. La protección debe ser completa para mayor seguridad."
      },
      {
        text: "Desenrollarlo a medias",
        emoji: "📊",
        correct: false,
        feedback: "Incompleto. Debe desenrollarse completamente para protección óptima."
      }
    ]
  },
  {
    id: 6,
    question: "PASO 6: Después de la relación sexual, ¿cuál es el procedimiento correcto?",
    options: [
      {
        text: "Retirarlo cuidadosamente sujetando la base",
        emoji: "🤲",
        correct: true,
        feedback: "Perfecto. Retirar con cuidado evita derrames y mantiene la protección."
      },
      {
        text: "Dejarlo puesto hasta que se afloje solo",
        emoji: "⏳",
        correct: false,
        feedback: "Riesgoso. Debe retirarse antes de que se afloje para evitar derrames."
      },
      {
        text: "Retirarlo rápidamente de una vez",
        emoji: "💨",
        correct: false,
        feedback: "No recomendado. La retirada brusca puede causar derrames."
      }
    ]
  },
  {
    id: 7,
    question: "ALMACENAMIENTO: ¿Dónde es mejor guardar los preservativos?",
    options: [
      {
        text: "En un lugar fresco, seco y sin luz directa",
        emoji: "🌡️",
        correct: true,
        feedback: "Correcto. Las condiciones ideales preservan la integridad del material."
      },
      {
        text: "En la billetera para tenerlos siempre",
        emoji: "💼",
        correct: false,
        feedback: "No ideal. El calor corporal y la fricción pueden dañarlos."
      },
      {
        text: "En el auto para emergencias",
        emoji: "🚗",
        correct: false,
        feedback: "Problemático. Las temperaturas extremas del auto pueden dañar el látex."
      }
    ]
  },
  {
    id: 8,
    question: "CONSEJO: Un amigo pregunta si puede usar un preservativo que encontró. ¿Qué le aconsejas?",
    options: [
      {
        text: "Que verifique la fecha de vencimiento y el estado del envase",
        emoji: "🔍",
        correct: true,
        feedback: "Buen consejo. La verificación es esencial para la seguridad."
      },
      {
        text: "Que lo use sin problema, cualquiera sirve",
        emoji: "🤷",
        correct: false,
        feedback: "Mal consejo. No todos los preservativos están en buen estado."
      },
      {
        text: "Que lo pruebe inflándolo primero",
        emoji: "🎈",
        correct: false,
        feedback: "Incorrecto. Inflarlo puede debilitarlo y no es método de verificación adecuado."
      }
    ]
  },
  {
    id: 9,
    question: "REUTILIZACIÓN: ¿Se puede usar el mismo preservativo dos veces en una noche?",
    options: [
      {
        text: "No, siempre debe usarse uno nuevo cada vez",
        emoji: "🆕",
        correct: true,
        feedback: "Correcto. Cada acto sexual requiere un preservativo nuevo para mantener la efectividad."
      },
      {
        text: "Sí, si se lava bien con agua y jabón",
        emoji: "🧼",
        correct: false,
        feedback: "Incorrecto. Lavar no restaura las propiedades protectoras del preservativo."
      },
      {
        text: "Sí, si se da vuelta",
        emoji: "🔃",
        correct: false,
        feedback: "Peligroso. Dar vuelta un preservativo usado puede contaminar con fluidos corporales."
      }
    ]
  },
  {
    id: 10,
    question: "ALERGIAS: Tu pareja menciona alergia al látex. ¿Cuál es la mejor opción?",
    options: [
      {
        text: "Buscar preservativos de materiales alternativos",
        emoji: "🔬",
        correct: true,
        feedback: "Excelente. Existen preservativos de poliuretano y otros materiales seguros."
      },
      {
        text: "Continuar sin protección",
        emoji: "🚫",
        correct: false,
        feedback: "Peligroso. Las alergias son serias y requieren alternativas, no omitir protección."
      },
      {
        text: "Suspender la actividad sexual",
        emoji: "⏹️",
        correct: false,
        feedback: "Innecesario. Hay alternativas disponibles sin necesidad de suspender la intimidad."
      }
    ]
  },
  {
    id: 11,
    question: "REALIDAD vs FICCIÓN: En las películas raramente muestran el uso de preservativos. ¿Qué opinas?",
    options: [
      {
        text: "Las películas no reflejan la realidad del sexo seguro",
        emoji: "📺",
        correct: true,
        feedback: "Correcto. Las películas priorizan la narrativa sobre la educación sexual realista."
      },
      {
        text: "Si no aparece en películas, no es tan importante",
        emoji: "🤔",
        correct: false,
        feedback: "Falso. Los medios de entretenimiento no son fuentes de educación sexual."
      },
      {
        text: "Mencionar protección arruina el romanticismo",
        emoji: "💔",
        correct: false,
        feedback: "Incorrecto. Cuidar la salud mutua es un acto de amor y responsabilidad."
      }
    ]
  },
  {
    id: 12,
    question: "EMERGENCIA: Se rompe el preservativo durante el acto. ¿Cuál es el protocolo correcto?",
    options: [
      {
        text: "Detenerse inmediatamente y consultar opciones médicas",
        emoji: "🛑",
        correct: true,
        feedback: "Correcto. Existen opciones de anticoncepción de emergencia y profilaxis post-exposición."
      },
      {
        text: "Continuar como si nada hubiera pasado",
        emoji: "👀",
        correct: false,
        feedback: "Peligroso. Ignorar la situación aumenta los riesgos considerablemente."
      },
      {
        text: "Retirarlo y continuar sin protección",
        emoji: "🔌",
        correct: false,
        feedback: "Muy riesgoso. Continuar sin protección después de una rotura es altamente peligroso."
      }
    ]
  },
  {
    id: 13,
    question: "COMODIDAD: ¿Qué hacer si los preservativos resultan incómodos?",
    options: [
      {
        text: "Probar diferentes marcas y tallas hasta encontrar el adecuado",
        emoji: "📏",
        correct: true,
        feedback: "Excelente. La talla correcta es fundamental para comodidad y efectividad."
      },
      {
        text: "Aceptar que son incómodos por naturaleza",
        emoji: "😣",
        correct: false,
        feedback: "Falso. Los preservativos bien ajustados deben ser cómodos."
      },
      {
        text: "Usar solo cuando sea absolutamente necesario",
        emoji: "⚠️",
        correct: false,
        feedback: "Riesgoso. La protección debe ser consistente, no ocasional."
      }
    ]
  },
  {
    id: 14,
    question: "COMPATIBILIDAD: ¿Qué tipo de lubricante NO es compatible con preservativos de látex?",
    options: [
      {
        text: "Lubricantes a base de aceite o petróleo",
        emoji: "🛢️",
        correct: true,
        feedback: "Correcto. Los aceites degradan el látex. Usar solo lubricantes base agua o silicona."
      },
      {
        text: "Lubricantes a base de agua",
        emoji: "💧",
        correct: false,
        feedback: "Incorrecto. Los lubricantes base agua son completamente compatibles con látex."
      },
      {
        text: "Lubricantes a base de silicona",
        emoji: "🧴",
        correct: false,
        feedback: "Incorrecto. Los lubricantes de silicona también son seguros con látex."
      }
    ]
  },
  {
    id: 15,
    question: "PREPARACIÓN: Vas a una fiesta o evento social. ¿Cuál es la actitud más responsable?",
    options: [
      {
        text: "Llevar preservativos por si surge una situación íntima",
        emoji: "🎯",
        correct: true,
        feedback: "Responsable. La preparación es clave para mantener relaciones seguras."
      },
      {
        text: "Improvisar si surge la situación",
        emoji: "🎲",
        correct: false,
        feedback: "Riesgoso. La improvisación en temas de salud sexual no es recomendable."
      },
      {
        text: "Pedir prestado si es necesario",
        emoji: "🤝",
        correct: false,
        feedback: "No ideal. La responsabilidad personal incluye estar preparado."
      }
    ]
  },
  {
    id: 16,
    question: "RESPONSABILIDAD COMPARTIDA: ¿De quién es la responsabilidad de tener preservativos?",
    options: [
      {
        text: "De ambas personas que van a tener relaciones",
        emoji: "👫",
        correct: true,
        feedback: "Correcto. La salud sexual es responsabilidad compartida entre las parejas."
      },
      {
        text: "Solo del hombre",
        emoji: "👨",
        correct: false,
        feedback: "Incorrecto. Es un estereotipo desactualizado. Ambos deben estar preparados."
      },
      {
        text: "De quien tome la iniciativa",
        emoji: "🎯",
        correct: false,
        feedback: "Incompleto. La responsabilidad es compartida, no solo de quien inicia."
      }
    ]
  },
  {
    id: 17,
    question: "EDUCACIÓN: ¿Cuál es el mejor enfoque para hablar de sexo seguro?",
    options: [
      {
        text: "Informar basándose en evidencia científica y sin tabúes",
        emoji: "🔬",
        correct: true,
        feedback: "Excelente. La educación sexual debe ser científica, clara y sin prejuicios."
      },
      {
        text: "Cada persona debe investigar por su cuenta",
        emoji: "🕵️",
        correct: false,
        feedback: "Insuficiente. La educación estructurada es importante para evitar información errónea."
      },
      {
        text: "Mantener el tema como algo privado y no discutirlo",
        emoji: "🤐",
        correct: false,
        feedback: "Contraproducente. La comunicación abierta es fundamental para la salud sexual."
      }
    ]
  },
  {
    id: 18,
    question: "PRIMERA VEZ: Alguien va a usar preservativo por primera vez. ¿Qué consejo le das?",
    options: [
      {
        text: "Practicar colocándolo en privado antes de usarlo con la pareja",
        emoji: "📚",
        correct: true,
        feedback: "Sabio consejo. La práctica previa reduce nervios y asegura uso correcto."
      },
      {
        text: "Que aprenda sobre la marcha con su pareja",
        emoji: "🎭",
        correct: false,
        feedback: "No recomendado. La práctica previa es importante para uso correcto."
      },
      {
        text: "Que busque tutoriales en internet durante el momento",
        emoji: "📱",
        correct: false,
        feedback: "Impractico. La información debe estudiarse antes, no durante la intimidad."
      }
    ]
  },
  {
    id: 19,
    question: "ACTITUDES: ¿Los preservativos interfieren con el placer sexual?",
    options: [
      {
        text: "Con la talla y técnica correctas, no deben interferir significativamente",
        emoji: "⚖️",
        correct: true,
        feedback: "Correcto. El uso adecuado permite disfrutar manteniendo la protección."
      },
      {
        text: "Siempre reducen el placer considerablemente",
        emoji: "📉",
        correct: false,
        feedback: "Exagerado. Con el preservativo adecuado, la diferencia es mínima."
      },
      {
        text: "Depende del estado de ánimo del momento",
        emoji: "🎭",
        correct: false,
        feedback: "Subjetivo. La percepción varía, pero la protección es objetivamente necesaria."
      }
    ]
  },
  {
    id: 20,
    question: "PREGUNTA FINAL: ¿Cuál es el principal beneficio del uso de preservativos?",
    options: [
      {
        text: "Permitir disfrutar la intimidad con tranquilidad y seguridad",
        emoji: "🕊️",
        correct: true,
        feedback: "Excelente. La verdadera libertad sexual viene de la protección y la tranquilidad mental."
      },
      {
        text: "Únicamente prevenir embarazos no deseados",
        emoji: "👶",
        correct: false,
        feedback: "Incompleto. También protegen contra infecciones de transmisión sexual."
      },
      {
        text: "Demostrar responsabilidad ante la pareja",
        emoji: "🎓",
        correct: false,
        feedback: "Parcial. Aunque es responsable, el beneficio principal es la protección integral."
      }
    ]
  }
];


const steps: Step[] = stepsData.map(step => ({
  ...step,
  options: shuffleOptions(step.options)
}));

export default function ComicPoneloSimulator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

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

        // Inicializar activityScores si no existe
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
      setLives(updatedData.game.totalLives);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const handleOptionClick = (optionIndex: number) => {
    if (!userData) return;

    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const activityKey = `activity_${ACTIVITY_ID}`;
    const isCorrect = steps[currentStep].options[optionIndex].correct;

    if (isCorrect) {
      const updatedData: UserData = {
        ...userData,
        game: {
          ...userData.game,
          totalScore: userData.game.totalScore + POINTS_PER_CORRECT
        },
        progress: {
          ...userData.progress,
          activityScores: {
            ...userData.progress.activityScores,
            [activityKey]: (userData.progress.activityScores[activityKey] || 0) + POINTS_PER_CORRECT
          },
          activityTimes: {
            ...userData.progress.activityTimes,
            [ACTIVITY_ID]: new Date().toISOString()
          }
        }
      };
      saveUserData(updatedData);
    } else {
      const newLives = Math.max(0, userData.game.totalLives - 1);
      const updatedData: UserData = {
        ...userData,
        game: {
          ...userData.game,
          totalLives: newLives
        },
        progress: {
          ...userData.progress,
          activityTimes: {
            ...userData.progress.activityTimes,
            [ACTIVITY_ID]: new Date().toISOString()
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
    if (!userData) return;

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
    }
  };

  const handleRestart = () => {
    if (!userData) return;

    const updatedData: UserData = {
      ...userData,
      game: {
        ...userData.game,
        totalScore: 0,
        totalLives: 3
      }
    };

    saveUserData(updatedData);

    setCurrentStep(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setCompleted(false);
    setGameKey(prev => prev + 1);
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
      <>
        <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">ESI: Ponelo Bien</h1>
          </div>
        </header>

        <GameStatusBar
          key={gameKey}
          title="PONELO BIEN"
          score={score}
          lives={lives}
          level={1}
          currentQuestion={steps.length}
          totalQuestions={steps.length}
        />
        
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <Trophy className="w-16 h-16 text-yellow-500" />
            </div>
            
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
              ¡MISIÓN CUMPLIDA!
            </h2>
            
            <p className="text-center text-xl text-gray-700 mb-8">
              {getScoreMessage()}
            </p>

            <div className="bg-blue-50 rounded-lg border-l-4 border-blue-500 p-6 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tu Puntuación</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-blue-600">{score}</span>
                <span className="text-lg text-gray-700">puntos</span>
              </div>
              <p className="text-gray-600 mt-2">
                {Math.round((score / (steps.length * POINTS_PER_CORRECT)) * 100)}% de respuestas correctas
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Recordatorios Importantes
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-1 text-yellow-600 flex-shrink-0" />
                  <span>Usar preservativo en toda relación sexual</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-1 text-yellow-600 flex-shrink-0" />
                  <span>Verificar fecha de vencimiento</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-1 text-yellow-600 flex-shrink-0" />
                  <span>Conservar en lugar fresco y seco</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-1 text-yellow-600 flex-shrink-0" />
                  <span>Usar uno nuevo en cada relación</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-1 text-yellow-600 flex-shrink-0" />
                  <span>Combinar con otros métodos anticonceptivos</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Intentar de Nuevo
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const currentStepData = steps[currentStep];
  const selectedOptionData = selectedOption !== null ? currentStepData.options[selectedOption] : null;

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">ESI: Ponelo Bien</h1>
        </div>
      </header>

      <GameStatusBar
        key={gameKey}
        title="PONELO BIEN"
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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Pregunta {currentStep + 1} de {steps.length}</h2>
              <span className="bg-white text-blue-600 px-3 py-1 rounded-full font-bold text-sm">
                {lives} vidas
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
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900">
                {currentStepData.question}
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              {currentStepData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showFeedback && handleOptionClick(index)}
                  disabled={showFeedback || lives === 0}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4 ${
                    selectedOption === index
                      ? option.correct
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : showFeedback
                        ? option.correct
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                        : lives === 0
                          ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 cursor-pointer'
                  }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="text-gray-800 font-medium flex-1">{option.text}</span>
                  {showFeedback && selectedOption === index && (
                    <div>
                      {option.correct ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {showFeedback && selectedOptionData && (
              <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${
                selectedOptionData.correct 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div>
                  {selectedOptionData.correct ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                </div>
                <p className={`font-medium ${selectedOptionData.correct ? 'text-green-800' : 'text-red-800'}`}>
                  {selectedOptionData.feedback}
                </p>
              </div>
            )}

            {showFeedback && (
              <div className="flex justify-center">
                {lives > 0 ? (
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    {currentStep === steps.length - 1 ? 'Ver Resultados' : 'Siguiente'}
                  </button>
                ) : (
                  <div className="w-full">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mb-4">
                      <p className="text-red-800 font-bold">Sin vidas disponibles</p>
                      <p className="text-red-700 text-sm mt-1">Compra una vida para continuar</p>
                    </div>
                    <button
                      onClick={() => setShowPurchaseModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                    >
                      Comprar Vida
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}