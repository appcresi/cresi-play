"use client";
import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, XCircle, RotateCcw, Trophy, AlertTriangle, Zap, Star } from 'lucide-react';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';

// Extiende la interfaz Window para incluir gameStorage
declare global {
  interface Window {
    gameStorage?: Map<string, string>;
  }
}

// Storage keys
const SCORE_STORAGE_KEY = 'totalGameScore';
const LIVES_STORAGE_KEY = 'totalGameLives';

// Datos importados
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

// Datos importados
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

const steps: Step[] = [
  {
    id: 1,
    question: "🔍 PASO 1: Estás a punto de usar un preservativo. ¿Cuál es la primera verificación importante?",
    options: [
      {
        text: "Revisar la fecha de vencimiento cuidadosamente",
        emoji: "📅",
        correct: true,
        feedback: "¡Correcto! ✅ Verificar la fecha de vencimiento es fundamental. Un preservativo vencido pierde efectividad."
      },
      {
        text: "Abrirlo rápidamente para no perder el momento",
        emoji: "⚡",
        correct: false,
        feedback: "No es recomendable. ⚠️ Siempre hay que verificar la fecha antes de abrir el envase."
      },
      {
        text: "Guardarlo para usar más tarde",
        emoji: "💾",
        correct: false,
        feedback: "Incorrecto. 🚫 La preparación debe hacerse antes del contacto íntimo."
      }
    ]
  },
  {
    id: 2,
    question: "📦 PASO 2: El preservativo está en buen estado. ¿Cuál es la forma correcta de abrir el envase?",
    options: [
      {
        text: "Con los dedos, cuidadosamente por el borde",
        emoji: "👆",
        correct: true,
        feedback: "¡Excelente! 👍 Usar los dedos evita dañar el material del preservativo."
      },
      {
        text: "Con los dientes para mayor rapidez",
        emoji: "🦷",
        correct: false,
        feedback: "No recomendado. ❌ Los dientes pueden hacer pequeños agujeros imperceptibles."
      },
      {
        text: "Con tijeras o cuchillo",
        emoji: "✂️",
        correct: false,
        feedback: "Peligroso. ⚠️ Los objetos cortantes pueden dañar el preservativo."
      }
    ]
  },
  {
    id: 3,
    question: "🎯 PASO 3: Tienes el preservativo en tus manos. ¿Qué debes verificar antes de colocarlo?",
    options: [
      {
        text: "Que esté orientado correctamente para desenrollarse",
        emoji: "🔄",
        correct: true,
        feedback: "¡Perfecto! ✨ La orientación correcta permite un desenrollado fácil y seguro."
      },
      {
        text: "Colocarlo inmediatamente sin verificar",
        emoji: "⏰",
        correct: false,
        feedback: "No es seguro. 🚫 Siempre hay que verificar la orientación primero."
      },
      {
        text: "Inflarlo para verificar que no tenga agujeros",
        emoji: "🎈",
        correct: false,
        feedback: "Incorrecto. ❌ Inflarlo puede debilitar el material. Solo verificar visualmente."
      }
    ]
  },
  {
    id: 4,
    question: "🤏 PASO 4: El preservativo está correctamente orientado. ¿Qué hacer con la punta antes de colocarlo?",
    options: [
      {
        text: "Presionar la punta para expulsar el aire",
        emoji: "👌",
        correct: true,
        feedback: "¡Correcto! 💡 Eliminar el aire previene que se forme una burbuja que podría romperlo."
      },
      {
        text: "Humedecerlo con agua",
        emoji: "💧",
        correct: false,
        feedback: "Innecesario. ℹ️ Los preservativos ya vienen con lubricante incorporado."
      },
      {
        text: "Colocarlo directamente sin preparación",
        emoji: "➡️",
        correct: false,
        feedback: "No recomendado. ⚠️ Es importante expulsar el aire de la punta primero."
      }
    ]
  },
  {
    id: 5,
    question: "📏 PASO 5: Has presionado la punta correctamente. ¿Cómo completar la colocación?",
    options: [
      {
        text: "Desenrollarlo completamente hasta la base",
        emoji: "📐",
        correct: true,
        feedback: "¡Excelente! 🎯 La cobertura completa asegura máxima protección."
      },
      {
        text: "Cubrir solo la parte superior",
        emoji: "🔺",
        correct: false,
        feedback: "Insuficiente. ❌ La protección debe ser completa para mayor seguridad."
      },
      {
        text: "Desenrollarlo a medias",
        emoji: "↕️",
        correct: false,
        feedback: "Incompleto. ⚠️ Debe desenrollarse completamente para protección óptima."
      }
    ]
  },
  {
    id: 6,
    question: "🔚 PASO 6: Después de la relación sexual, ¿cuál es el procedimiento correcto?",
    options: [
      {
        text: "Retirarlo cuidadosamente sujetando la base",
        emoji: "🤲",
        correct: true,
        feedback: "¡Perfecto! ✅ Retirar con cuidado evita derrames y mantiene la protección."
      },
      {
        text: "Dejarlo puesto hasta que se afloje solo",
        emoji: "⏳",
        correct: false,
        feedback: "Riesgoso. ⚠️ Debe retirarse antes de que se afloje para evitar derrames."
      },
      {
        text: "Retirarlo rápidamente de una vez",
        emoji: "💨",
        correct: false,
        feedback: "No recomendado. ❌ La retirada brusca puede causar derrames."
      }
    ]
  },
  {
    id: 7,
    question: "🏠 ALMACENAMIENTO: ¿Dónde es mejor guardar los preservativos?",
    options: [
      {
        text: "En un lugar fresco, seco y sin luz directa",
        emoji: "🌡️",
        correct: true,
        feedback: "¡Correcto! 🏆 Las condiciones ideales preservan la integridad del material."
      },
      {
        text: "En la billetera para tenerlos siempre",
        emoji: "💼",
        correct: false,
        feedback: "No ideal. ⚠️ El calor corporal y la fricción pueden dañarlos."
      },
      {
        text: "En el auto para emergencias",
        emoji: "🚗",
        correct: false,
        feedback: "Problemático. ❌ Las temperaturas extremas del auto pueden dañar el látex."
      }
    ]
  },
  {
    id: 8,
    question: "🤝 CONSEJO: Un amigo pregunta si puede usar un preservativo que encontró. ¿Qué le aconsejas?",
    options: [
      {
        text: "Que verifique la fecha de vencimiento y el estado del envase",
        emoji: "🔍",
        correct: true,
        feedback: "¡Buen consejo! 👨‍⚕️ La verificación es esencial para la seguridad."
      },
      {
        text: "Que lo use sin problema, cualquiera sirve",
        emoji: "🤷",
        correct: false,
        feedback: "Mal consejo. ❌ No todos los preservativos están en buen estado."
      },
      {
        text: "Que lo pruebe inflándolo primero",
        emoji: "🎈",
        correct: false,
        feedback: "Incorrecto. ⚠️ Inflarlo puede debilitarlo y no es método de verificación adecuado."
      }
    ]
  },
  {
    id: 9,
    question: "🔄 REUTILIZACIÓN: ¿Se puede usar el mismo preservativo dos veces en una noche?",
    options: [
      {
        text: "No, siempre debe usarse uno nuevo cada vez",
        emoji: "🆕",
        correct: true,
        feedback: "¡Correcto! ✅ Cada acto sexual requiere un preservativo nuevo para mantener la efectividad."
      },
      {
        text: "Sí, si se lava bien con agua y jabón",
        emoji: "🧼",
        correct: false,
        feedback: "Incorrecto. ❌ Lavar no restaura las propiedades protectoras del preservativo."
      },
      {
        text: "Sí, si se da vuelta",
        emoji: "🔄",
        correct: false,
        feedback: "Peligroso. ⚠️ Dar vuelta un preservativo usado puede contaminar con fluidos corporales."
      }
    ]
  },
  {
    id: 10,
    question: "🤧 ALERGIAS: Tu pareja menciona alergia al látex. ¿Cuál es la mejor opción?",
    options: [
      {
        text: "Buscar preservativos de materiales alternativos",
        emoji: "🔬",
        correct: true,
        feedback: "¡Excelente! 🌟 Existen preservativos de poliuretano y otros materiales seguros."
      },
      {
        text: "Continuar sin protección",
        emoji: "🚫",
        correct: false,
        feedback: "Peligroso. ❌ Las alergias son serias y requieren alternativas, no omitir protección."
      },
      {
        text: "Suspender la actividad sexual",
        emoji: "⏹️",
        correct: false,
        feedback: "Innecesario. ℹ️ Hay alternativas disponibles sin necesidad de suspender la intimidad."
      }
    ]
  },
  {
    id: 11,
    question: "🎬 REALIDAD vs FICCIÓN: En las películas raramente muestran el uso de preservativos. ¿Qué opinas?",
    options: [
      {
        text: "Las películas no reflejan la realidad del sexo seguro",
        emoji: "📺",
        correct: true,
        feedback: "¡Correcto! 🎯 Las películas priorizan la narrativa sobre la educación sexual realista."
      },
      {
        text: "Si no aparece en películas, no es tan importante",
        emoji: "🤔",
        correct: false,
        feedback: "Falso. ❌ Los medios de entretenimiento no son fuentes de educación sexual."
      },
      {
        text: "Mencionar protección arruina el romanticismo",
        emoji: "💔",
        correct: false,
        feedback: "Incorrecto. 💕 Cuidar la salud mutua es un acto de amor y responsabilidad."
      }
    ]
  },
  {
    id: 12,
    question: "🚨 EMERGENCIA: Se rompe el preservativo durante el acto. ¿Cuál es el protocolo correcto?",
    options: [
      {
        text: "Detenerse inmediatamente y consultar opciones médicas",
        emoji: "🛑",
        correct: true,
        feedback: "¡Correcto! 🏥 Existen opciones de anticoncepción de emergencia y profilaxis post-exposición."
      },
      {
        text: "Continuar como si nada hubiera pasado",
        emoji: "👀",
        correct: false,
        feedback: "Peligroso. ❌ Ignorar la situación aumenta los riesgos considerablemente."
      },
      {
        text: "Retirarlo y continuar sin protección",
        emoji: "🚫",
        correct: false,
        feedback: "Muy riesgoso. ⚠️ Continuar sin protección después de una rotura es altamente peligroso."
      }
    ]
  },
  {
    id: 13,
    question: "👕 COMODIDAD: ¿Qué hacer si los preservativos resultan incómodos?",
    options: [
      {
        text: "Probar diferentes marcas y tallas hasta encontrar el adecuado",
        emoji: "📏",
        correct: true,
        feedback: "¡Excelente! 👍 La talla correcta es fundamental para comodidad y efectividad."
      },
      {
        text: "Aceptar que son incómodos por naturaleza",
        emoji: "😣",
        correct: false,
        feedback: "Falso. ❌ Los preservativos bien ajustados deben ser cómodos."
      },
      {
        text: "Usar solo cuando sea absolutamente necesario",
        emoji: "⚠️",
        correct: false,
        feedback: "Riesgoso. ⚠️ La protección debe ser consistente, no ocasional."
      }
    ]
  },
  {
    id: 14,
    question: "🧪 COMPATIBILIDAD: ¿Qué tipo de lubricante NO es compatible con preservativos de látex?",
    options: [
      {
        text: "Lubricantes a base de aceite o petróleo",
        emoji: "🛢️",
        correct: true,
        feedback: "¡Correcto! ⚗️ Los aceites degradan el látex. Usar solo lubricantes base agua o silicona."
      },
      {
        text: "Lubricantes a base de agua",
        emoji: "💧",
        correct: false,
        feedback: "Incorrecto. ✅ Los lubricantes base agua son completamente compatibles con látex."
      },
      {
        text: "Lubricantes a base de silicona",
        emoji: "🧴",
        correct: false,
        feedback: "Incorrecto. ✅ Los lubricantes de silicona también son seguros con látex."
      }
    ]
  },
  {
    id: 15,
    question: "🎒 PREPARACIÓN: Vas a una fiesta o evento social. ¿Cuál es la actitud más responsable?",
    options: [
      {
        text: "Llevar preservativos por si surge una situación íntima",
        emoji: "🎯",
        correct: true,
        feedback: "¡Responsable! 🌟 La preparación es clave para mantener relaciones seguras."
      },
      {
        text: "Improvisar si surge la situación",
        emoji: "🎲",
        correct: false,
        feedback: "Riesgoso. ⚠️ La improvisación en temas de salud sexual no es recomendable."
      },
      {
        text: "Pedir prestado si es necesario",
        emoji: "🤝",
        correct: false,
        feedback: "No ideal. ❌ La responsabilidad personal incluye estar preparado."
      }
    ]
  },
  {
    id: 16,
    question: "🤝 RESPONSABILIDAD COMPARTIDA: ¿De quién es la responsabilidad de tener preservativos?",
    options: [
      {
        text: "De ambas personas que van a tener relaciones",
        emoji: "👫",
        correct: true,
        feedback: "¡Correcto! 🤝 La salud sexual es responsabilidad compartida entre las parejas."
      },
      {
        text: "Solo del hombre",
        emoji: "👨",
        correct: false,
        feedback: "Incorrecto. ❌ Es un estereotipo desactualizado. Ambos deben estar preparados."
      },
      {
        text: "De quien tome la iniciativa",
        emoji: "🎯",
        correct: false,
        feedback: "Incompleto. ⚠️ La responsabilidad es compartida, no solo de quien inicia."
      }
    ]
  },
  {
    id: 17,
    question: "📚 EDUCACIÓN: ¿Cuál es el mejor enfoque para hablar de sexo seguro?",
    options: [
      {
        text: "Informar basándose en evidencia científica y sin tabúes",
        emoji: "🔬",
        correct: true,
        feedback: "¡Excelente! 📖 La educación sexual debe ser científica, clara y sin prejuicios."
      },
      {
        text: "Cada persona debe investigar por su cuenta",
        emoji: "🕵️",
        correct: false,
        feedback: "Insuficiente. ⚠️ La educación estructurada es importante para evitar información errónea."
      },
      {
        text: "Mantener el tema como algo privado y no discutirlo",
        emoji: "🤐",
        correct: false,
        feedback: "Contraproducente. ❌ La comunicación abierta es fundamental para la salud sexual."
      }
    ]
  },
  {
    id: 18,
    question: "🔰 PRIMERA VEZ: Alguien va a usar preservativo por primera vez. ¿Qué consejo le das?",
    options: [
      {
        text: "Practicar colocándolo en privado antes de usarlo con la pareja",
        emoji: "📚",
        correct: true,
        feedback: "¡Sabio consejo! 💡 La práctica previa reduce nervios y asegura uso correcto."
      },
      {
        text: "Que aprenda sobre la marcha con su pareja",
        emoji: "🎭",
        correct: false,
        feedback: "No recomendado. ⚠️ La práctica previa es importante para uso correcto."
      },
      {
        text: "Que busque tutoriales en internet durante el momento",
        emoji: "📱",
        correct: false,
        feedback: "Impractical. ❌ La información debe estudiarse antes, no durante la intimidad."
      }
    ]
  },
  {
    id: 19,
    question: "💭 ACTITUDES: ¿Los preservativos interfieren con el placer sexual?",
    options: [
      {
        text: "Con la talla y técnica correctas, no deben interferir significativamente",
        emoji: "⚖️",
        correct: true,
        feedback: "¡Correcto! 🎯 El uso adecuado permite disfrutar manteniendo la protección."
      },
      {
        text: "Siempre reducen el placer considerablemente",
        emoji: "📉",
        correct: false,
        feedback: "Exagerado. ❌ Con el preservativo adecuado, la diferencia es mínima."
      },
      {
        text: "Depende del estado de ánimo del momento",
        emoji: "🎭",
        correct: false,
        feedback: "Subjetivo. ⚠️ La percepción varía, pero la protección es objetivamente necesaria."
      }
    ]
  },
  {
    id: 20,
    question: "🏆 PREGUNTA FINAL: ¿Cuál es el principal beneficio del uso de preservativos?",
    options: [
      {
        text: "Permitir disfrutar la intimidad con tranquilidad y seguridad",
        emoji: "🕊️",
        correct: true,
        feedback: "¡Excelente! 🏆 La verdadera libertad sexual viene de la protección y la tranquilidad mental."
      },
      {
        text: "Únicamente prevenir embarazos no deseados",
        emoji: "👶",
        correct: false,
        feedback: "Incompleto. ⚠️ También protegen contra infecciones de transmisión sexual."
      },
      {
        text: "Demostrar responsabilidad ante la pareja",
        emoji: "🎓",
        correct: false,
        feedback: "Parcial. ℹ️ Aunque es responsable, el beneficio principal es la protección integral."
      }
    ]
  }
];

export default function ComicPoneloSimulator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [gameKey, setGameKey] = useState(0); // Para forzar re-render del GameStatusBar
  
  // Inicializar storage y estados con valores del storage
  const [score, setScore] = useState(() => {
    if (typeof window !== 'undefined') {
      if (!window.gameStorage) {
        window.gameStorage = new Map();
        window.gameStorage.set(SCORE_STORAGE_KEY, '0');
        window.gameStorage.set(LIVES_STORAGE_KEY, '3');
      }
      return parseInt(window.gameStorage.get(SCORE_STORAGE_KEY) || '0');
    }
    return 0;
  });
  
  const [lives, setLives] = useState(() => {
    if (typeof window !== 'undefined') {
      if (!window.gameStorage) {
        window.gameStorage = new Map();
        window.gameStorage.set(SCORE_STORAGE_KEY, '0');
        window.gameStorage.set(LIVES_STORAGE_KEY, '3');
      }
      return parseInt(window.gameStorage.get(LIVES_STORAGE_KEY) || '3');
    }
    return 3;
  });

  const handleOptionClick = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setShowFeedback(true);
    
    if (steps[currentStep].options[optionIndex].correct) {
      const newScore = score + 50; // 50 puntos por respuesta correcta
      setScore(newScore);
      if (!window.gameStorage) window.gameStorage = new Map();
      window.gameStorage.set(SCORE_STORAGE_KEY, newScore.toString());
    } else {
      // Respuesta incorrecta, perder una vida
      const newLives = Math.max(0, lives - 1);
      setLives(newLives);
      if (!window.gameStorage) window.gameStorage = new Map();
      window.gameStorage.set(LIVES_STORAGE_KEY, newLives.toString());
      
      if (newLives === 0) {
        // Sin vidas, mostrar modal de compra
        setShowPurchaseModal(true);
      }
    }
    
    // Forzar actualización del GameStatusBar
    setGameKey(prev => prev + 1);
  };

  const handleNext = () => {
    if (lives === 0) {
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
    setCurrentStep(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setLives(3);
    setCompleted(false);
    
    // Resetear storage
    if (!window.gameStorage) window.gameStorage = new Map();
    window.gameStorage.set(SCORE_STORAGE_KEY, '0');
    window.gameStorage.set(LIVES_STORAGE_KEY, '3');
    setGameKey(prev => prev + 1);
  };

  const handlePurchaseSuccess = () => {
    // Recargar los valores del storage después de la compra
    const newScore = parseInt(window.gameStorage?.get(SCORE_STORAGE_KEY) || '0');
    const newLives = parseInt(window.gameStorage?.get(LIVES_STORAGE_KEY) || '3');
    setScore(newScore);
    setLives(newLives);
    setGameKey(prev => prev + 1);
    
    // Cerrar el modal después de la compra exitosa
    setShowPurchaseModal(false);
  };

  const getScoreMessage = () => {
    const percentage = (score / (steps.length * 50)) * 100;
    if (percentage === 100) return "¡SUPERHÉROE/A! 🦸‍♂️";
    if (percentage >= 80) return "¡CASI PERFECTO! 🌟";
    if (percentage >= 60) return "¡BUEN TRABAJO! 👍";
    return "¡A ENTRENAR MÁS! 💪";
  };

  if (completed) {
    return (
      <>
        <GameStatusBar
          key={gameKey}
          title="PONELO BIEN"
          score={score}
          lives={lives}
          level={1}
          currentQuestion={steps.length}
          totalQuestions={steps.length}
        />
        
        <div className="w-full relative mt-20">
          {/* Elementos decorativos de cómic */}
          <div className="absolute top-2 left-2 text-4xl opacity-20 rotate-12">💥</div>
          <div className="absolute top-4 right-4 text-3xl opacity-20 -rotate-12">⚡</div>
          <div className="absolute bottom-4 left-4 text-4xl opacity-20 rotate-45">🌟</div>
          <div className="absolute bottom-2 right-2 text-2xl opacity-20 -rotate-45">💫</div>
          
          <div className="w-full relative z-10">
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl overflow-hidden border-4 border-black relative">
              {/* Efecto de rayos de cómic */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-5"></div>
              
              <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-6 text-white text-center relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-black rounded-full"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-black rounded-full"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full"></div>
                
                <Trophy className="w-16 h-16 mx-auto mb-3 animate-bounce" />
                <h1 className="text-3xl font-black mb-2 transform -skew-x-12 bg-white text-black px-3 py-1 rounded-lg shadow-lg">
                  ¡MISIÓN CUMPLIDA!
                </h1>
                <div className="text-xl font-bold bg-black text-yellow-400 px-3 py-1 rounded-full inline-block transform rotate-2 shadow-lg">
                  {getScoreMessage()}
                </div>
              </div>
              
              <div className="p-6 text-center relative">
                <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl p-4 mb-4 border-4 border-black shadow-lg transform -rotate-1">
                  <h2 className="text-2xl font-black text-white mb-2 transform skew-x-12">
                    TU PUNTUACIÓN
                  </h2>
                  <div className="text-4xl font-black text-yellow-300 mb-2 drop-shadow-lg">
                    {score}
                  </div>
                  <div className="bg-white text-black px-3 py-1 rounded-full font-bold">
                    {Math.round((score / (steps.length * 50)) * 100)}% CORRECTO
                  </div>
                </div>

                <div className="bg-yellow-100 border-4 border-yellow-400 rounded-xl p-4 mb-4 text-left transform rotate-1">
                  <div className="flex items-start">
                    <div className="bg-yellow-400 p-2 rounded-full mr-3 flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-yellow-800" />
                    </div>
                    <div>
                      <h3 className="font-black text-yellow-800 text-lg mb-2">¡RECORDATORIOS IMPORTANTES!</h3>
                      <div className="text-yellow-700 space-y-1 font-semibold text-sm">
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span>Usar preservativo en TODA relación sexual</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span>Verificar fecha de vencimiento</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span>Conservar en lugar fresco y seco</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span>Usar uno nuevo en cada relación</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-2 flex-shrink-0" />
                          <span>Combinar con otros métodos anticonceptivos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRestart}
                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-full font-black border-4 border-black shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center mx-auto"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  ¡OTRA VEZ!
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentStepData = steps[currentStep];
  const selectedOptionData = selectedOption !== null ? currentStepData.options[selectedOption] : null;

  return (
    <>
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

      <div className="w-full relative mt-20">
        <div className="w-full relative z-10">
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl overflow-hidden border-4 border-black">
            {/* Header estilo cómic */}
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-4 text-white relative">
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-black rounded-full"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full"></div>
              
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-2xl font-black flex items-center transform -skew-x-12 bg-white text-black px-3 py-1 rounded-lg shadow-lg">
                  <Heart className="w-6 h-6 mr-2 text-red-500" />
                  PONELO BIEN
                </h1>
                <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-black border-2 border-black shadow-lg">
                  {currentStep + 1}/{steps.length}
                </div>
              </div>
              <div className="w-full bg-white/30 rounded-full h-3 border-2 border-black">
                <div 
                  className="bg-yellow-400 h-full rounded-full transition-all duration-500 ease-out border-2 border-black"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Pregunta estilo burbuja de cómic */}
            <div className="p-6 relative">
              <div className="bg-gradient-to-r from-yellow-200 to-orange-200 border-4 border-black rounded-2xl p-4 mb-4 relative shadow-lg">
                <div className="absolute -bottom-3 left-6 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-black"></div>
                <div className="absolute -bottom-2 left-7 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-yellow-200"></div>
                
                <h2 className="text-lg font-bold text-gray-800 leading-relaxed">
                  {currentStepData.question}
                </h2>
              </div>

              {/* Opciones estilo cómic */}
              <div className="space-y-3 mb-4">
                {currentStepData.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !showFeedback && handleOptionClick(index)}
                    disabled={showFeedback || lives === 0}
                    className={`w-full p-3 rounded-xl border-4 transition-all duration-300 text-left font-semibold transform hover:scale-105 ${
                      selectedOption === index
                        ? option.correct
                          ? 'border-green-500 bg-green-100 shadow-lg'
                          : 'border-red-500 bg-red-100 shadow-lg'
                        : showFeedback
                          ? option.correct
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-400 bg-gray-100'
                          : lives === 0
                            ? 'border-gray-400 bg-gray-100 cursor-not-allowed opacity-50'
                            : 'border-black bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 cursor-pointer shadow-md'
                    } ${showFeedback || lives === 0 ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3 bg-white rounded-full p-2 border-2 border-black">
                        {option.emoji}
                      </span>
                      <span className="text-gray-800 flex-1 text-sm">{option.text}</span>
                      {showFeedback && selectedOption === index && (
                        <div className="ml-auto bg-white rounded-full p-1 border-2 border-black">
                          {option.correct ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Feedback estilo cómic */}
              {showFeedback && selectedOptionData && (
                <div className={`p-4 rounded-2xl mb-4 border-4 border-black shadow-lg transform rotate-1 ${
                  selectedOptionData.correct 
                    ? 'bg-gradient-to-r from-green-200 to-lime-200' 
                    : 'bg-gradient-to-r from-red-200 to-pink-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      selectedOptionData.correct ? 'bg-green-400' : 'bg-red-400'
                    }`}>
                      {selectedOptionData.correct ? (
                        <Zap className="w-5 h-5 text-white" />
                      ) : (
                        <XCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <p className="text-gray-800 font-bold text-sm">
                      {selectedOptionData.feedback}
                    </p>
                  </div>
                </div>
              )}

              {/* Botón siguiente estilo cómic - Mostrar siempre si hay feedback, independientemente de las vidas */}
              {showFeedback && (
                <div className="text-center">
                  {lives > 0 ? (
                    <button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-6 py-3 rounded-full font-black border-4 border-black shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      {currentStep === steps.length - 1 ? '¡VER RESULTADOS! 🏆' : '¡SIGUIENTE! ➡️'}
                    </button>
                  ) : (
                    <div className="bg-red-100 border-4 border-red-400 rounded-2xl p-4 text-center">
                      <p className="text-red-800 font-bold mb-2">¡Sin vidas! Necesitas comprar una vida para continuar</p>
                      <button
                        onClick={() => setShowPurchaseModal(true)}
                        className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full font-black border-2 border-black shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        Comprar Vida
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}