"use client"
import React, { useState, useEffect } from 'react';
import { IconTrophy, IconHeart, IconHeartFilled, IconStarFilled, IconClock, IconCheckbox, IconUser, IconTarget } from '@tabler/icons-react';

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

interface GameStatusProps {
  title?: string;
  score?: number;
  lives?: number;
  level?: number;
  timeLeft?: number;
  currentQuestion?: number;
  totalQuestions?: number;
  showProfile?: boolean;
  activityName?: string;
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

  // Actualizar puntuación de juego
  static updateGameScore(newScore: number, activityName?: string): UserData {
    const userData = this.loadUserData();
    userData.game.totalScore = newScore;
    
    // Si se especifica actividad, actualizar su puntuación específica
    if (activityName) {
      userData.progress.activityScores[activityName] = newScore - userData.game.totalScore + (userData.progress.activityScores[activityName] || 0);
    }
    
    this.saveUserData(userData);
    return userData;
  }

  // Actualizar vidas
  static updateLives(newLives: number): UserData {
    const userData = this.loadUserData();
    userData.game.totalLives = Math.max(0, Math.min(3, newLives));
    this.saveUserData(userData);
    return userData;
  }

  // Registrar visita a actividad
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

const GameStatusBar = ({
  title = "CrESI Educativo",
  score = 0,
  lives = 3,
  level = 1,
  timeLeft,
  currentQuestion,
  totalQuestions,
  showProfile = true,
  activityName
}: GameStatusProps) => {
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Registrar visita a la actividad cuando se monta el componente
    if (activityName) {
      UserDataManager.visitActivity(activityName);
    }
  }, [activityName]);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
  };

  // Sincronizar cambios de puntuación con el sistema unificado
  useEffect(() => {
    if (score !== userData.game.totalScore) {
      const updatedData = UserDataManager.updateGameScore(score, activityName);
      setUserData(updatedData);
      
      setIsScoreAnimating(true);
      const timer = setTimeout(() => setIsScoreAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [score, activityName]);

  // Sincronizar cambios de vidas
  useEffect(() => {
    if (lives !== userData.game.totalLives) {
      const updatedData = UserDataManager.updateLives(lives);
      setUserData(updatedData);
    }
  }, [lives]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Profile & Title */}
          <div className="flex items-center space-x-4">
            {showProfile && userData.profile.character.image && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <img
                    src={`/${userData.profile.character.image}`}
                    alt={userData.profile.character.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{userData.profile.username}</p>
                  <p className="text-xs text-gray-500">{userData.profile.character.name}</p>
                </div>
              </div>
            )}
            
            <div className="border-l border-gray-200 pl-4">
              <h1 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <IconTrophy size={20} className="text-amber-500" />
                {title}
              </h1>
              {activityName && (
                <p className="text-xs text-gray-500">{activityName}</p>
              )}
            </div>
          </div>

          {/* Right Section - Stats */}
          <div className="flex items-center space-x-3">
            {/* Questions Progress */}
            {typeof currentQuestion === 'number' && totalQuestions && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                <IconCheckbox size={16} className="text-purple-600" />
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{currentQuestion}</span>
                  <span className="text-gray-500">/{totalQuestions}</span>
                </div>
              </div>
            )}

            {/* Timer */}
            {typeof timeLeft === 'number' && (
              <div className={`flex items-center space-x-2 px-3 py-2 border rounded-lg ${
                timeLeft <= 10 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                <IconClock size={16} className={timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'} />
                <div className={`text-sm font-medium ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                  {timeLeft}s
                </div>
              </div>
            )}

            {/* Score */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <IconTrophy size={16} className="text-green-600" />
              <div className="text-sm">
                <span className="text-xs text-gray-500 hidden sm:inline">Puntos: </span>
                <span className={`font-medium text-gray-900 ${
                  isScoreAnimating ? 'text-green-600 font-bold animate-pulse' : ''
                }`}>
                  {userData.game.totalScore.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Streak */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <IconTarget size={16} className="text-orange-600" />
              <div className="text-sm">
                <span className="text-xs text-gray-500">Racha: </span>
                <span className="font-medium text-gray-900">{userData.game.streak}</span>
              </div>
            </div>

            {/* Lives */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-1">
                {/* Mobile: Show number */}
                <div className="sm:hidden flex items-center space-x-1">
                  <IconHeart size={16} className="text-red-600" />
                  <span className="text-sm font-medium text-gray-900">{userData.game.totalLives}</span>
                </div>
                
                {/* Desktop: Show hearts */}
                <div className="hidden sm:flex space-x-1">
                  {[...Array(3)].map((_, i) =>
                    i < userData.game.totalLives ? (
                      <IconHeartFilled
                        key={i}
                        size={16}
                        className="text-red-500 transition-all duration-200 hover:scale-110"
                      />
                    ) : (
                      <IconHeart
                        key={i}
                        size={16}
                        className="text-gray-300 transition-all duration-200"
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Level Badge */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
              <IconStarFilled size={16} className="text-indigo-600" />
              <div className="text-sm">
                <span className="text-xs text-gray-500">Nivel: </span>
                <span className="font-medium text-gray-900">{level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Progress Bar for Questions */}
        {typeof currentQuestion === 'number' && totalQuestions && (
          <div className="sm:hidden mt-3 flex items-center space-x-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 font-medium">
              {currentQuestion}/{totalQuestions}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStatusBar;