"use client";
import { useState, useEffect } from 'react';
import GameStatusBar from '@/components/GameStatusBar';
import { ChevronUp, RotateCcw, Plus, Minus } from 'lucide-react';
import esiTermsByCategory from '../data/esiTermsByCategory.json';

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
  achievements: Achievement[];
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en';
  };
}

const STORAGE_KEY = 'cresi_user_data';
const ACTIVITY_ID = 'ImpostorGame';

export default function ESIImpostor() {
  const [gameState, setGameState] = useState<'setup' | 'names' | 'distribution' | 'playing' | 'reveal'>('setup');
  const [numPlayers, setNumPlayers] = useState(4);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentTerm, setCurrentTerm] = useState<any>(null);
  const [usedTermIndices, setUsedTermIndices] = useState<number[]>([]);
  const [impostorIndex, setImpostorIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [timer, setTimer] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const [startY, setStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [roundTerms, setRoundTerms] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', text: '', type: '' });

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      saveUserData();
    }
  }, [sessionScore, lives]);

  const loadUserData = () => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: UserData = JSON.parse(storedData);
        setUserData(data);
        setScore(data.game.totalScore);
        setLives(data.game.totalLives);
        
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
          totalScore: score,
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
          }
        }
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  useEffect(() => {
    if (!timerActive || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || revealed) return;
    const diff = Math.min(0, e.clientY - startY);
    setTranslateY(diff);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    if (translateY < -100) {
      setRevealed(true);
      setTranslateY(-200);
    } else {
      setTranslateY(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!revealed) {
      e.preventDefault();
      const diff = Math.min(0, e.touches[0].clientY - startY);
      setTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (translateY < -100) {
      setRevealed(true);
      setTranslateY(-200);
    } else {
      setTranslateY(0);
    }
  };

  const changeNumPlayers = (delta: number) => {
    const newNum = Math.max(3, Math.min(40, numPlayers + delta));
    setNumPlayers(newNum);
    const newNames = [...playerNames];
    if (delta > 0) {
      while (newNames.length < newNum) {
        newNames.push('');
      }
    } else {
      newNames.length = newNum;
    }
    setPlayerNames(newNames);
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const getAvailableTerms = (category: string) => {
    return esiTermsByCategory[category as keyof typeof esiTermsByCategory] || [];
  };

  const startGame = () => {
    if (!selectedCategory) return;

    const allTerms = getAvailableTerms(selectedCategory);
    if (allTerms.length === 0) return;

    setRoundTerms(allTerms);
    setUsedTermIndices([]);

    const randomIndex = Math.floor(Math.random() * allTerms.length);
    const randomTerm = allTerms[randomIndex];
    const randomImpostor = Math.floor(Math.random() * numPlayers);

    setCurrentTerm(randomTerm);
    setImpostorIndex(randomImpostor);
    setCurrentPlayerIndex(0);
    setUsedTermIndices([randomIndex]);
    setGameState('distribution');
    setTimer(300);
    setTimerActive(false);
    setRevealed(false);
    setTranslateY(0);
  };

  const nextRound = () => {
    const availableIndices = roundTerms
      .map((_, idx) => idx)
      .filter(idx => !usedTermIndices.includes(idx));

    if (availableIndices.length === 0 || lives <= 0) {
      resetGame();
      return;
    }

    const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const newTerm = roundTerms[randomIdx];
    const randomImpostor = Math.floor(Math.random() * numPlayers);

    setCurrentTerm(newTerm);
    setImpostorIndex(randomImpostor);
    setCurrentPlayerIndex(0);
    setUsedTermIndices([...usedTermIndices, randomIdx]);
    setTimer(300);
    setTimerActive(false);
    setRevealed(false);
    setTranslateY(0);
    setGameState('distribution');
    setRoundNumber(roundNumber + 1);
  };

  const nextPlayer = () => {
    if (currentPlayerIndex === 0) {
      setTimerActive(true);
    }

    if (currentPlayerIndex < numPlayers - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setRevealed(false);
      setTranslateY(0);
    } else {
      setGameState('playing');
      setTimerActive(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const revealImpostor = () => {
    const earnedPoints = 50;
    setSessionScore(sessionScore + earnedPoints);
    setScore(score + earnedPoints);
    setGameState('reveal');
    setTimerActive(false);
  };

  const resetGame = () => {
    setGameState('setup');
    setTimer(300);
    setTimerActive(false);
    setRevealed(false);
    setTranslateY(0);
    setRoundTerms([]);
    setUsedTermIndices([]);
    setSessionScore(0);
    setLives(3);
    setRoundNumber(1);
    setSelectedCategory('');
  };

  const getPlayerDisplayName = (index: number) => {
    return playerNames[index] || `Jugador ${index + 1}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GameStatusBar
        title="CrESI: El Impostor"
        score={score}
        lives={lives}
        level={roundNumber}
      />

      <div className="flex-1 p-4 md:p-8 pt-24">
        <div className="max-w-4xl mx-auto">

          {gameState === 'setup' && (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Número de jugadores</h2>
                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => changeNumPlayers(-1)}
                    className="p-2 rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="text-4xl font-bold text-blue-600 w-20 text-center">{numPlayers}</span>
                  <button
                    onClick={() => changeNumPlayers(1)}
                    className="p-2 rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Selecciona una categoría</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.keys(esiTermsByCategory).map(cat => {
                    const categoryLabels: {[key: string]: {label: string, color: string, icon: string}} = {
                      salud: { label: 'Cuerpo', color: 'from-red-400 to-pink-500', icon: '🏃' },
                      diversidad: { label: 'Diversidad', color: 'from-yellow-400 to-orange-500', icon: '🌈' },
                      derechos: { label: 'Derechos', color: 'from-purple-400 to-pink-500', icon: '⚖️' },
                      prevencion: { label: 'Prevencion', color: 'from-green-400 to-teal-500', icon: '🛡️' },
                    };
                    const info = categoryLabels[cat];
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`p-3 rounded-lg font-semibold transition transform ${isSelected ? 'ring-4 ring-offset-2 ring-blue-500' : 'hover:scale-105'} bg-gradient-to-br ${info.color} text-white shadow-md hover:shadow-lg`}
                      >
                        <div className="text-2xl mb-2">{info.icon}</div>
                        <div className="text-sm">{info.label}</div>
                        <div className="text-xs mt-1 opacity-90">
                          {esiTermsByCategory[cat as keyof typeof esiTermsByCategory].length} palabras
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Nombres de los Jugadores</h2>
                <div className="space-y-2 mb-4">
                  {Array(numPlayers).fill(null).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={playerNames[i]}
                      onChange={(e) => updatePlayerName(i, e.target.value)}
                      placeholder={`Jugador ${i + 1}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
                <button
                  onClick={startGame}
                  disabled={!selectedCategory}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-bold transition"
                >
                  Comenzar Juego
                </button>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-sm">
                <p className="text-gray-700">
                  <strong>¿Cómo funciona?</strong> Selecciona una categoría y los nombres de jugadores. Un jugador será el impostor. ¡Descubre quién es!
                </p>
              </div>
            </div>
          )}

          {gameState === 'distribution' && currentTerm && (
            <div className="space-y-6">
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ transform: `translateY(${translateY}px)` }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 min-h-96 flex flex-col items-center justify-center transition-transform duration-300 cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden"
              >
                {!revealed ? (
                  <div className="text-center space-y-6">
                    <p className="text-gray-600 text-xl font-medium">{getPlayerDisplayName(currentPlayerIndex)}</p>
                    <p className="text-5xl font-bold text-gray-800">Desliza hacia arriba</p>
                    <ChevronUp className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
                  </div>
                ) : (
                  <div className="text-center space-y-8 w-full">
                    {currentPlayerIndex === impostorIndex ? (
                      <>
                        <p className="text-7xl font-bold text-red-500">?</p>
                        <div>
                          <p className="text-3xl font-bold text-red-600 mb-2">¡ERES EL IMPOSTOR!</p>
                          <p className="text-gray-600 text-lg">No conoces la palabra. ¡Descúbrela haciendo preguntas!</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-6xl font-bold text-blue-600">{currentTerm.word}</p>
                        <div className="inline-block bg-blue-100 text-blue-800 px-6 py-2 rounded-full font-semibold mb-4">
                          {currentTerm.category}
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg max-w-md mx-auto">
                          <p className="text-gray-700 text-sm italic">{currentTerm.definition}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {revealed && (
                <button
                  onClick={nextPlayer}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition"
                >
                  {currentPlayerIndex < numPlayers - 1 
                    ? `Siguiente: ${getPlayerDisplayName(currentPlayerIndex + 1)}`
                    : 'Comenzar Ronda'}
                </button>
              )}

              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white rounded h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded transition-all"
                      style={{ width: `${((currentPlayerIndex + 1) / numPlayers) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-700 font-medium">{currentPlayerIndex + 1}/{numPlayers}</p>
                </div>
              </div>
            </div>
          )}

          {gameState === 'playing' && currentTerm && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                  <p className="text-gray-600 font-medium mb-3">Tiempo restante</p>
                  <p className={`text-7xl font-bold font-mono ${timer <= 60 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timer)}
                  </p>
                  <div className="flex gap-3 justify-center mt-6">
                    <button
                      onClick={() => setTimerActive(!timerActive)}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition"
                    >
                      {timerActive ? '⏸ Pausar' : '▶ Reanudar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-lg text-gray-800 mb-3">¡Hora de Jugar!</h3>
                <p className="text-gray-700">
                  Todos conocen la palabra excepto uno. Hagan preguntas estratégicas para identificar al impostor sin revelar completamente la palabra.
                </p>
              </div>

              <button
                onClick={revealImpostor}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold text-lg transition"
              >
                Revelar Respuesta
              </button>
            </div>
          )}

          {gameState === 'reveal' && currentTerm && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Resultado</h2>
                  <p className="text-gray-600 mb-3">La palabra era:</p>
                  <p className="text-6xl font-bold text-blue-600 mb-6">{currentTerm.word}</p>
                  <div className="inline-block bg-blue-100 text-blue-800 px-6 py-2 rounded-full font-semibold mb-6">
                    {currentTerm.category}
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg mb-6">
                    <p className="text-gray-700 text-sm italic">{currentTerm.definition}</p>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
                  <p className="font-bold text-red-700 text-lg">
                    El impostor era: <span className="text-2xl">{getPlayerDisplayName(impostorIndex)}</span>
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
                  <p className="font-bold text-green-700 text-lg">
                    +50 puntos
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-8">
                  <p className="text-gray-700 font-semibold mb-2">Información educativa:</p>
                  <p className="text-gray-600 text-sm">
                    Este término es fundamental para la ESI porque contribuye a la formación integral de estudiantes en temas de sexualidad, relaciones interpersonales, derechos y valores.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={nextRound}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold transition"
                  >
                    Siguiente Ronda
                  </button>
                  <button
                    onClick={resetGame}
                    className="bg-gray-400 hover:bg-gray-500 text-white py-4 rounded-lg font-bold transition"
                  >
                    Inicio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}