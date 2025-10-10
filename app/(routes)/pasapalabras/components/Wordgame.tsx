"use client";
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, HelpCircle, SkipForward
} from 'lucide-react';
import { palabras } from '../utils/words';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';
import FinalReport from '../components/FinalReport';

// UserData interfaces (matching MoodTracker)
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

// UserDataManager class (same as MoodTracker)
class UserDataManager {
  private static readonly STORAGE_KEY = 'cresi_user_data';

  public static getDefaultUserData(): UserData {
    return {
      profile: {
        character: { id: 0, name: '', image: '' },
        username: 'Estudiante',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      },
      game: {
        totalScore: 0,
        totalLives: 3,
        streak: 0
      },
      progress: {
        completedActivities: [],
        activityScores: {},
        activityTimes: {},
        lastVisits: {}
      },
      mood: {
        history: [],
        lastEntry: null
      },
      achievements: [],
      settings: {
        notifications: true,
        theme: 'light',
        language: 'es'
      }
    };
  }

  static loadUserData(): UserData {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as UserData;
        parsedData.profile.lastLogin = new Date().toISOString();
        this.saveUserData(parsedData);
        return parsedData;
      }
      return this.getDefaultUserData();
    } catch (error) {
      console.error('Error loading user data:', error);
      return this.getDefaultUserData();
    }
  }

  static saveUserData(userData: UserData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }
}

type LetterKey = keyof typeof palabras;
const letters = Object.keys(palabras) as LetterKey[];

const UnifiedWordGame = () => {
  // UserData integration
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());

  // Game state
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<{ palabra: string; definicion: string } | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [passedLetters, setPassedLetters] = useState<Set<string>>(new Set());
  const [incorrectLetters, setIncorrectLetters] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [usedWords, setUsedWords] = useState<{ palabra: string; definicion: string }[]>([]);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [correctWords, setCorrectWords] = useState<{ palabra: string; definicion: string }[]>([]);
  const [incorrectWords, setIncorrectWords] = useState<{ palabra: string; definicion: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const maxWords = 20;
  const INITIAL_LIVES = 3;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
  };

  const saveGameData = () => {
    const updatedData = { ...userData };
    updatedData.game.totalScore = score;
    updatedData.game.totalLives = lives;
    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
  };

  const getNextWord = () => {
    const currentLetter = letters[currentLetterIndex];
    const wordsForLetter = palabras[currentLetter];
    const unusedWords = wordsForLetter.filter(word => !usedWords.some(uw => uw.palabra === word.palabra));

    if (unusedWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * unusedWords.length);
      setCurrentWord(unusedWords[randomIndex]);
      setUsedWords(prev => [...prev, unusedWords[randomIndex]]);
      resetTimer();
    } else {
      moveToNextLetter();
    }
  };

  const resetTimer = () => {
    setTimeLeft(30);
    setTimerActive(true);
  };

  const moveToNextLetter = () => {
    setCurrentLetterIndex((prevIndex) => (prevIndex + 1) % letters.length);
    setIsIncorrect(false);
    setProgress((prev) => prev + 1);
  };

  const handleLifeLoss = () => {
    const newLives = lives - 1;
    setLives(newLives);
    
    if (newLives <= 0 && score >= 200) {
      setShowPurchaseModal(true);
    } else if (newLives <= 0) {
      handleGameEnd();
    }
  };

  const handlePurchaseLife = () => {
    // El PurchaseModal ya maneja la compra y actualiza UserData
    // Solo necesitamos recargar los datos y continuar el juego
    const updatedData = UserDataManager.loadUserData();
    setScore(updatedData.game.totalScore);
    setLives(updatedData.game.totalLives);
    setShowPurchaseModal(false);
  };

  const handleClosePurchaseModal = () => {
    // Recargar datos por si se hizo una compra
    const updatedData = UserDataManager.loadUserData();
    setScore(updatedData.game.totalScore);
    setLives(updatedData.game.totalLives);
    
    if (updatedData.game.totalLives < 1) {
      handleGameEnd();
    }
    setShowPurchaseModal(false);
  };

  const handleSubmit = (value: string) => {
    if (!currentWord) return;
    const cleanedInput = value.replace(/\s+/g, '').toLowerCase();
    
    if (cleanedInput === currentWord.palabra.toLowerCase()) {
      setGuessedLetters((prev) => new Set(prev).add(currentWord.palabra.charAt(0)));
      setScore((prev) => prev + 100);
      setCorrectWords((prev) => [...prev, currentWord]);
      toast.success('¡Correcto!');
      
      if (correctWords.length % 5 === 0) {
        setLevel(prev => prev + 1);
      }
      
      moveToNextLetter();
    } else {
      toast.error('Incorrecto. Intenta de nuevo.');
      setIncorrectLetters((prev) => new Set(prev).add(currentWord.palabra.charAt(0)));
      setIncorrectWords((prev) => [...prev, currentWord]);
      setIsIncorrect(true);
      handleLifeLoss();
      
      setTimeout(() => {
        moveToNextLetter();
      }, 1000);
    }

    if (progress + 1 === maxWords) {
      handleGameEnd();
    }
  };

  const handlePass = () => {
    const currentLetter = letters[currentLetterIndex];
    setPassedLetters((prev) => new Set(prev).add(currentLetter));
    moveToNextLetter();
    if (progress + 1 === maxWords) {
      handleGameEnd();
    }
  };

  const handleHelp = () => {
    if (currentWord) {
      const scrambledLetters = currentWord.palabra.split('').sort(() => Math.random() - 0.5).join('-');
      toast.success(`Pista: La palabra tiene ${currentWord.palabra.length} letras: ${scrambledLetters}`);
    }
  };

  const handleGameEnd = () => {
    saveGameData();
    setShowFinalReport(true);
  };

  const resetGame = () => {
    setCurrentLetterIndex(0);
    setGuessedLetters(new Set());
    setPassedLetters(new Set());
    setIncorrectLetters(new Set());
    setProgress(0);
    setIsIncorrect(false);
    setUsedWords([]);
    setShowFinalReport(false);
    setLives(INITIAL_LIVES);
    setCorrectWords([]);
    setIncorrectWords([]);
    getNextWord();
    resetTimer();
  };

  const handlePlayAgain = () => {
    resetGame();
    setShowFinalReport(false);
  };

  const handleGoBack = () => {
    window.location.href = '/';
  };

  const toggleNightMode = () => {
    setIsNightMode((prev) => !prev);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error al intentar activar el modo de pantalla completa: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    getNextWord();
  }, [currentLetterIndex]);

  useEffect(() => {
    if (!timerActive) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      handlePass();
      setTimerActive(false);
    }
  }, [timerActive, timeLeft]);

  const AlphabetCircle = React.memo(() => {
    const radius = 155;
    const center = 190;

    return (
      <div className="relative w-[380px] h-[380px]">
        <div>
          {letters.map((letter, index) => {
            const angle = (index / letters.length) * 2 * Math.PI - Math.PI / 2;
            const x = center + radius * Math.cos(angle) - 22;
            const y = center + radius * Math.sin(angle) - 22;

            const isGuessed = guessedLetters.has(letter);
            const isPassed = passedLetters.has(letter);
            const isIncorrect = incorrectLetters.has(letter);
            const isCurrent = letter === letters[currentLetterIndex];

            const classNames = `absolute flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 font-bold text-lg shadow-lg z-20
              ${isGuessed ? 'bg-green-500 text-white scale-110' : 
                isPassed ? 'bg-gray-500 text-white' : 
                isIncorrect ? 'bg-red-500 text-white' : 
                isCurrent ? 'bg-blue-600 text-white scale-125 ring-4 ring-blue-300' : 
                'bg-purple-500 text-white'}`;

            return (
              <div
                key={letter}
                className={classNames}
                style={{ left: `${x}px`, top: `${y}px` }}
              >
                {letter}
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  return (
    <div className={`min-h-screen ${isNightMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <GameStatusBar
        title="Pasapalabra"
        score={score}
        lives={lives}
        level={level}
      />
      
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onPurchase={handlePurchaseLife}
      />

      {showFinalReport ? (
        <FinalReport
          correctWords={correctWords}
          incorrectWords={incorrectWords}
          onPlayAgain={handlePlayAgain}
          onGoBack={handleGoBack}
        />
      ) : (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Tarjeta de definición estilo Google Classroom */}
          
          <div className={`mb-8 ${isNightMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden transition-colors duration-300 mx-auto max-w-4xl`}>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-24 relative">
              <div className="absolute bottom-4 left-6 flex items-center gap-4">
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                  <span className="text-gray-600 text-xs font-medium">Letra</span>
                  <p className="text-blue-600 font-bold text-2xl">{letters[currentLetterIndex]}</p>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                  <span className="text-gray-600 text-xs font-medium">Progreso</span>
                  <p className="text-blue-600 font-bold text-lg">{progress}/{maxWords}</p>
                </div>
              </div>
            </div>
            <div className={`p-8 ${isNightMode ? 'bg-gray-800' : 'bg-white'}`}>
              {currentWord && (
                <div className="text-center">
                  <p className={`text-xl md:text-2xl font-medium ${isNightMode ? 'text-gray-200' : 'text-gray-800'} leading-relaxed`}>{currentWord.definicion}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Sección del juego */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex justify-center items-center">
              {/* Timer Circle */}
              <div className="absolute w-[380px] h-[380px] flex justify-center items-center pointer-events-none z-10">
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    className="text-gray-200" 
                    strokeWidth="6" 
                    stroke="currentColor" 
                    fill="transparent" 
                    cx="50" 
                    cy="50" 
                    r="32" 
                  />
                  <circle
                    className="text-current"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="201.062"
                    strokeDashoffset={201.062 * (1 - timeLeft / 30)}
                    stroke={timeLeft > 20 ? "#10b981" : timeLeft > 10 ? "#f59e0b" : "#ef4444"}
                    fill="transparent"
                    cx="50"
                    cy="50"
                    r="32"
                    style={{
                      transition: 'stroke-dashoffset 1s linear, stroke 1s linear',
                      filter: 'drop-shadow(0 0 6px currentColor)',
                    }}
                  />
                </svg>
              </div>

              {/* Círculo de letras */}
              <AlphabetCircle />

              {/* Área de respuesta en el centro */}
              <div className="absolute inset-0 flex flex-col justify-center items-center z-30">
                {currentWord && (
                  <div className="flex flex-col items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border-2 border-gray-200">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSubmit(inputValue);
                          setInputValue('');
                        }
                      }}
                      autoFocus
                      className="w-48 px-4 py-2 text-base text-gray-900 bg-white border-2 border-blue-400 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-300 transition-all text-center font-medium shadow-md"
                      placeholder="Respuesta"
                    />
                    
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleSubmit(inputValue);
                          setInputValue('');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg font-medium shadow-md transition-all"
                        title="Enviar respuesta"
                      >
                        <ArrowRight size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={handleHelp}
                        className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-lg shadow-md transition-all"
                        title="Obtener pista"
                      >
                        <HelpCircle size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={handlePass}
                        className="bg-gray-600 hover:bg-gray-700 text-white p-2.5 rounded-lg shadow-md transition-all"
                        title="Pasar palabra"
                      >
                        <SkipForward size={18} />
                      </button>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-xs text-gray-600 font-medium">
                        Letras: <span className="font-bold text-gray-800">{inputValue.length}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-800">{timeLeft}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Toaster 
            position="top-center"
            toastOptions={{
              className: isNightMode ? 'bg-gray-800 text-white' : '',
              duration: 2000,
            }}
          />
        </div>
      )}

      <button 
        onClick={toggleNightMode} 
        className='fixed bottom-6 right-6 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-gray-200'
      >
        <Image 
          src={isNightMode ? '/sun-mode.svg' : '/night-mode.svg'} 
          alt="Modo" 
          width={24} 
          height={24} 
        />
      </button>
      
      <button 
        onClick={handleFullscreen} 
        className='hidden lg:block fixed bottom-6 left-6 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 border border-gray-200'
      >
        <Image 
          src='/full-screen.svg' 
          alt='Pantalla Completa' 
          width={24} 
          height={24} 
        />
      </button>
    </div>
  );
};

export default UnifiedWordGame;