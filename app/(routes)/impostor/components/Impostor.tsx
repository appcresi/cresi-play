"use client";
import { useState, useEffect } from 'react';
import GameStatusBar from '@/components/GameStatusBar';
import { IconChevronUp, IconMinus, IconPlus } from '@tabler/icons-react';
import esiTermsByCategory from '../data/esiTermsByCategory.json';
import UserDataManager from '@/lib/userDataManager';
import { getActivityById } from '@/lib/activities';

const ACTIVITY = getActivityById('impostor');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Impostor';
const ACCENT = ACTIVITY?.color ?? '#7B1FA2';

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
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [hasLoaded, setHasLoaded] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      saveUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionScore]);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    UserDataManager.visitActivity(ACTIVITY_TITLE);
    setHasLoaded(true);
  };

  const saveUserData = () => {
    const current = UserDataManager.loadUserData();
    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: score
      },
      progress: {
        ...current.progress,
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: Math.max(current.progress.activityScores[ACTIVITY_TITLE] || 0, sessionScore)
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [ACTIVITY_TITLE]: new Date().toISOString()
        }
      }
    };

    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
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

    if (availableIndices.length === 0) {
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
    setSessionScore(prev => prev + earnedPoints);
    setScore(prev => prev + earnedPoints);
    setGameState('reveal');
    setTimerActive(false);

    // Marcamos la actividad como completada apenas termina la primera
    // ronda — este juego no tiene un "final" fijo (es de mesa, para jugar
    // rondas indefinidamente), así que "completarlo" significa haber
    // jugado al menos una vez, no llegar a un puntaje o nivel específico.
    const current = UserDataManager.loadUserData();
    if (!current.progress.completedActivities.includes(ACTIVITY_TITLE)) {
      current.progress.completedActivities.push(ACTIVITY_TITLE);
      UserDataManager.saveUserData(current);
      setUserData(current);
    }
  };

  /**
   * Antes esto ponía `lives` en 3 — y como hay un efecto que guarda cada
   * vez que cambia el puntaje de sesión, terminaba reescribiendo las
   * vidas COMPARTIDAS de toda la cuenta a 3, gratis. Este juego ni
   * siquiera resta vidas en ningún momento, así que "reiniciar" no debía
   * tocarlas para nada — ahora no lo hace.
   */
  const resetGame = () => {
    setGameState('setup');
    setTimer(300);
    setTimerActive(false);
    setRevealed(false);
    setTranslateY(0);
    setRoundTerms([]);
    setUsedTermIndices([]);
    setSessionScore(0);
    setRoundNumber(1);
    setSelectedCategory('');
    loadUserData();
  };

  const getPlayerDisplayName = (index: number) => {
    return playerNames[index] || `Jugador ${index + 1}`;
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <GameStatusBar
        title="CrESI: El Impostor"
        score={score}
        lives={lives}
        level={roundNumber}
      />

      <div className="flex-1 p-4 md:p-8 pt-24">
        <div className="max-w-4xl mx-auto">

          {gameState === 'setup' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Número de jugadores</h2>
                <div className="flex items-center gap-3 justify-center">
                  <button
                    onClick={() => changeNumPlayers(-1)}
                    className="p-2 rounded-full border-2 hover:bg-gray-50 transition"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                  >
                    <IconMinus size={20} />
                  </button>
                  <span className="text-4xl font-bold w-20 text-center" style={{ color: ACCENT }}>{numPlayers}</span>
                  <button
                    onClick={() => changeNumPlayers(1)}
                    className="p-2 rounded-full border-2 hover:bg-gray-50 transition"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                  >
                    <IconPlus size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Seleccioná una categoría</h2>
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
                        className={`p-3 rounded-xl font-semibold transition transform ${isSelected ? 'ring-4 ring-offset-2' : 'hover:scale-105'} bg-gradient-to-br ${info.color} text-white shadow-sm hover:shadow-md`}
                        style={isSelected ? { '--tw-ring-color': ACCENT } as React.CSSProperties : undefined}
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

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Nombres de los jugadores</h2>
                <div className="space-y-2 mb-4">
                  {Array(numPlayers).fill(null).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={playerNames[i]}
                      onChange={(e) => updatePlayerName(i, e.target.value)}
                      placeholder={`Jugador ${i + 1}`}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 text-sm"
                      style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
                    />
                  ))}
                </div>
                <button
                  onClick={startGame}
                  disabled={!selectedCategory}
                  className="w-full text-white py-3 rounded-full font-bold transition disabled:bg-gray-300"
                  style={!selectedCategory ? undefined : { backgroundColor: ACCENT }}
                >
                  Comenzar juego
                </button>
              </div>

              <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: `${ACCENT}0D`, borderLeft: `4px solid ${ACCENT}` }}>
                <p className="text-gray-600">
                  <strong className="text-gray-800">¿Cómo funciona?</strong> Elegí una categoría y los nombres de los jugadores. Uno de ellos será el impostor. ¡Descubran quién es!
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
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-96 flex flex-col items-center justify-center transition-transform duration-300 cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden"
              >
                {!revealed ? (
                  <div className="text-center space-y-6">
                    <p className="text-gray-500 text-lg font-medium">{getPlayerDisplayName(currentPlayerIndex)}</p>
                    <p className="text-4xl font-bold text-gray-800">Deslizá hacia arriba</p>
                    <IconChevronUp className="w-10 h-10 mx-auto animate-bounce" style={{ color: ACCENT }} />
                  </div>
                ) : (
                  <div className="text-center space-y-6 w-full">
                    {currentPlayerIndex === impostorIndex ? (
                      <>
                        <p className="text-6xl font-bold text-red-500">?</p>
                        <div>
                          <p className="text-2xl font-bold text-red-600 mb-2">¡Sos el impostor!</p>
                          <p className="text-gray-500">No conocés la palabra. ¡Descubrila haciendo preguntas!</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-5xl font-bold" style={{ color: ACCENT }}>{currentTerm.word}</p>
                        <div
                          className="inline-block px-5 py-1.5 rounded-full font-semibold text-sm"
                          style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                        >
                          {currentTerm.category}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl max-w-md mx-auto">
                          <p className="text-gray-600 text-sm italic">{currentTerm.definition}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {revealed && (
                <button
                  onClick={nextPlayer}
                  className="w-full text-white py-3.5 rounded-full font-bold transition hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  {currentPlayerIndex < numPlayers - 1
                    ? `Siguiente: ${getPlayerDisplayName(currentPlayerIndex + 1)}`
                    : 'Comenzar ronda'}
                </button>
              )}

              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${((currentPlayerIndex + 1) / numPlayers) * 100}%`, backgroundColor: ACCENT }}
                    ></div>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">{currentPlayerIndex + 1}/{numPlayers}</p>
                </div>
              </div>
            </div>
          )}

          {gameState === 'playing' && currentTerm && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="text-center">
                  <p className="text-gray-500 font-medium mb-2 text-sm">Tiempo restante</p>
                  <p className={`text-6xl font-bold font-mono ${timer <= 60 ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatTime(timer)}
                  </p>
                  <div className="flex gap-3 justify-center mt-6">
                    <button
                      onClick={() => setTimerActive(!timerActive)}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold transition text-sm"
                    >
                      {timerActive ? '⏸ Pausar' : '▶ Reanudar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">¡Hora de jugar!</h3>
                <p className="text-gray-600 text-sm">
                  Todos conocen la palabra excepto uno. Hagan preguntas estratégicas para identificar al impostor sin revelar completamente la palabra.
                </p>
              </div>

              <button
                onClick={revealImpostor}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-full font-bold transition"
              >
                Revelar respuesta
              </button>
            </div>
          )}

          {gameState === 'reveal' && currentTerm && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-5">Resultado</h2>
                  <p className="text-gray-500 text-sm mb-2">La palabra era:</p>
                  <p className="text-5xl font-bold mb-4" style={{ color: ACCENT }}>{currentTerm.word}</p>
                  <div
                    className="inline-block px-5 py-1.5 rounded-full font-semibold text-sm mb-5"
                    style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                  >
                    {currentTerm.category}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl mb-5">
                    <p className="text-gray-600 text-sm italic">{currentTerm.definition}</p>
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-4">
                  <p className="font-semibold text-red-700">
                    El impostor era: <span className="text-lg">{getPlayerDisplayName(impostorIndex)}</span>
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-4 mb-4">
                  <p className="font-semibold text-green-700">
                    +50 puntos
                  </p>
                </div>

                <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: `${ACCENT}0D`, borderLeft: `4px solid ${ACCENT}` }}>
                  <p className="text-gray-800 font-medium text-sm mb-1">Información educativa:</p>
                  <p className="text-gray-600 text-sm">
                    Este término es fundamental para la ESI porque contribuye a la formación integral de estudiantes en temas de sexualidad, relaciones interpersonales, derechos y valores.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={nextRound}
                    className="text-white py-3 rounded-full font-bold transition hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Siguiente ronda
                  </button>
                  <button
                    onClick={resetGame}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-full font-bold transition"
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