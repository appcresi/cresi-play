"use client";

import { useState, useEffect, useCallback } from 'react';
import { Move, ArrowLeft, ArrowRight, Check, RefreshCw, Trophy, Heart, Target } from 'lucide-react';
import { bodySystems, type BodyPart, type BodySystem } from '../data/bodySystems';
import GameStatusBar from '@/components/GameStatusBar';

// Estructura unificada de datos del usuario
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
    history: any[];
    lastEntry: any | null;
  };
  achievements: any[];
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en';
  };
}

interface DraggedItem {
  id: string;
}

// Clase para manejar los datos del usuario
class UserDataManager {
  private static readonly STORAGE_KEY = 'cresi_user_data';

  // Datos por defecto
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

  // Cargar datos del usuario
  static loadUserData(): UserData {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as UserData;
        return parsedData;
      }
      return this.getDefaultUserData();
    } catch (error) {
      console.error('Error loading user data:', error);
      return this.getDefaultUserData();
    }
  }

  // Guardar datos del usuario
  static saveUserData(userData: UserData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Actualizar puntuación del juego
  static updateGameScore(newScore: number): UserData {
    const userData = this.loadUserData();
    userData.game.totalScore = newScore;
    this.saveUserData(userData);
    return userData;
  }

  // Completar sistema anatómico
  static completeSystem(systemName: string, score: number): UserData {
    const userData = this.loadUserData();
    const activityKey = `BioPuzzle-${systemName}`;
    
    if (!userData.progress.completedActivities.includes(activityKey)) {
      userData.progress.completedActivities.push(activityKey);
    }
    
    userData.progress.activityScores[activityKey] = score;
    userData.progress.activityTimes[activityKey] = new Date().toISOString();
    userData.game.totalScore += score * 50; // 50 puntos por cada parte correcta
    
    this.saveUserData(userData);
    return userData;
  }

  // Registrar visita
  static visitActivity(activityTitle: string): UserData {
    const userData = this.loadUserData();
    
    if (!userData.progress.lastVisits) {
      userData.progress.lastVisits = {};
    }
    
    userData.progress.lastVisits[activityTitle] = new Date().toISOString();
    this.saveUserData(userData);
    return userData;
  }
}

export default function AnatomiaApp() {
  const [currentSystemIndex, setCurrentSystemIndex] = useState(0);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [activeDropTargetId, setActiveDropTargetId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());
  const [sessionScore, setSessionScore] = useState(0);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const currentSystem = useCallback(() => bodySystems[currentSystemIndex], [currentSystemIndex]);

  useEffect(() => {
    // Cargar datos del usuario y registrar visita
    const data = UserDataManager.loadUserData();
    setUserData(data);
    UserDataManager.visitActivity('BioPuzzle');
  }, []);

  useEffect(() => {
    const system = currentSystem();
    setBodyParts(system.parts.map(part => ({ ...part, currentPosition: undefined, placed: false })));
    setScore(0);
    setLevelCompleted(false);
  }, [currentSystem]);

  const goToPreviousSystem = () => {
    setCurrentSystemIndex(prev => (prev > 0 ? prev - 1 : bodySystems.length - 1));
  };

  const goToNextSystem = () => {
    setCurrentSystemIndex(prev => (prev < bodySystems.length - 1 ? prev + 1 : 0));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem({ id });
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (targetId: string) => {
    setActiveDropTargetId(targetId);
  };

  const handleDragLeave = () => {
    setActiveDropTargetId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const droppedItemId = draggedItem.id;
    const targetPart = bodyParts.find(part => part.id === targetId);

    if (targetPart && droppedItemId === targetId) {
      setBodyParts(prevParts =>
        prevParts.map(part =>
          part.id === droppedItemId
            ? { ...part, currentPosition: { ...part.correctPosition }, placed: true }
            : part
        )
      );

      const newScore = score + 1;
      setScore(newScore);
      setSessionScore(prev => prev + 50); // 50 puntos por parte correcta
      
      // Actualizar puntuación global
      const updatedData = UserDataManager.updateGameScore(userData.game.totalScore + 50);
      setUserData(updatedData);
    }

    setDraggedItem(null);
    setActiveDropTargetId(null);
  };

  const handleRemoveItem = (id: string) => {
    const part = bodyParts.find(p => p.id === id);
    if (part?.placed) {
      setBodyParts(prevParts =>
        prevParts.map(part =>
          part.id === id
            ? { ...part, currentPosition: undefined, placed: false }
            : part
        )
      );
      setScore(prevScore => prevScore - 1);
      setSessionScore(prev => prev - 50);
      
      // Actualizar puntuación global
      const updatedData = UserDataManager.updateGameScore(Math.max(0, userData.game.totalScore - 50));
      setUserData(updatedData);
    }
  };

  const resetCurrentGame = () => {
    setBodyParts(currentSystem().parts.map(part => ({ ...part, currentPosition: undefined, placed: false })));
    setScore(0);
    setLevelCompleted(false);
  };

  useEffect(() => {
    if (bodyParts.length > 0 && score === bodyParts.length) {
      setLevelCompleted(true);
      // Completar sistema
      UserDataManager.completeSystem(currentSystem().name, score);
    } else {
      setLevelCompleted(false);
    }
  }, [score, bodyParts.length, currentSystem]);

  return (
    <div className="min-h-screen bg-gray-50">
      <GameStatusBar
        title="BioPuzzle"
        score={userData.game.totalScore}
        lives={userData.game.totalLives}
        level={currentSystemIndex + 1}
        activityName="BioPuzzle"
      />

      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <span className="text-3xl">🧬</span>
            </div>
            <h1 className="text-3xl font-medium text-gray-900 mb-2">ESI: Anatomía Humana</h1>
            <p className="text-gray-600">Arrastra las partes del cuerpo a su ubicación correcta</p>
          </div>

          {/* System Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousSystem}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-900">{currentSystem().name}</h2>
                <p className="text-sm text-gray-500">Sistema {currentSystemIndex + 1} de {bodySystems.length}</p>
              </div>

              <button
                onClick={goToNextSystem}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          {/* Main Game Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Game Board */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div
                  className="relative w-full h-96 lg:h-[500px] bg-blue-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden"
                  ref={containerRef}
                >
                  {/* Imagen del sistema */}
                  <img
                    src={currentSystem().imageUrl}
                    alt={currentSystem().name}
                    className="absolute inset-0 w-full h-full object-contain opacity-80"
                  />

                  {/* Zonas de destino */}
                  {bodyParts.map(part => (
                    <div
                      key={`target-${part.id}`}
                      className={`absolute rounded-lg transition-all duration-200 ${
                        part.placed
                          ? 'border-2 border-green-400 bg-green-50 pointer-events-none'
                          : activeDropTargetId === part.id
                            ? 'border-2 border-blue-400 bg-blue-50'
                            : 'border-2 border-gray-300 border-dashed hover:border-blue-300 hover:bg-blue-25'
                      }`}
                      style={{
                        left: `${(part.correctPosition.x / 800) * 100}%`,
                        top: `${(part.correctPosition.y / 800) * 100}%`,
                        width: `${Math.max(60, (80 / 800) * containerSize.width)}px`,
                        height: `${Math.max(30, (35 / 800) * containerSize.height)}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onDragOver={handleDragOver}
                      onDragEnter={() => !part.placed && handleDragEnter(part.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => !part.placed && handleDrop(e, part.id)}
                    />
                  ))}

                  {/* Elementos colocados */}
                  {bodyParts.map(part => (
                    part.currentPosition && (
                      <div
                        key={part.id}
                        className={`absolute px-3 py-1 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 ${
                          part.placed
                            ? 'bg-green-500 text-white border border-green-600'
                            : 'bg-red-500 text-white border border-red-600'
                        }`}
                        style={{
                          left: `${(part.currentPosition.x / 800) * 100}%`,
                          top: `${(part.currentPosition.y / 800) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 10,
                        }}
                        onClick={() => handleRemoveItem(part.id)}
                        title="Clic para quitar"
                      >
                        {part.name}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-6">
              {/* Progress Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Progreso</h3>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Completado</span>
                  <span className="text-sm font-medium text-gray-900">{score} / {bodyParts.length}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(score / bodyParts.length) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">{score}</div>
                    <div className="text-xs text-green-700">Correctas</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-lg font-semibold text-blue-600">{sessionScore}</div>
                    <div className="text-xs text-blue-700">Puntos</div>
                  </div>
                </div>
              </div>

              {/* Body Parts Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Partes disponibles</h3>
                
                <div className="space-y-2">
                  {bodyParts.map(part => (
                    !part.placed && (
                      <div
                        key={part.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, part.id)}
                        className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg 
                                 cursor-move hover:bg-blue-100 transition-colors group"
                      >
                        <Move size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="text-blue-900 font-medium">{part.name}</span>
                      </div>
                    )
                  ))}

                  {bodyParts.every(part => part.placed) && (
                    <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <Check size={20} className="text-green-600" />
                      <span className="text-green-700 font-medium">¡Todas las partes ubicadas!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={resetCurrentGame}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 
                             text-white rounded-lg font-medium transition-colors"
                  >
                    <RefreshCw size={18} />
                    Reiniciar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {levelCompleted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              
              <h3 className="text-2xl font-medium text-gray-900 mb-2">
                ¡Sistema completado!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Has identificado correctamente todas las partes del {currentSystem().name}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">{score}</div>
                  <div className="text-xs text-green-700">Partes correctas</div>
                </div>
                <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">{sessionScore}</div>
                  <div className="text-xs text-blue-700">Puntos ganados</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goToNextSystem}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 
                           text-white rounded-lg font-medium transition-colors"
                >
                  Siguiente sistema
                  <ArrowRight size={18} />
                </button>
                
                <button
                  onClick={resetCurrentGame}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg 
                           font-medium transition-colors"
                >
                  Repetir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}