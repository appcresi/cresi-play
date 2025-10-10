'use client';

import React, { useState, useEffect } from 'react';
import { IconUser, IconSettings } from '@tabler/icons-react';

interface Character {
  id: number;
  name: string;
  image: string;
}

const characters: Character[] = [
  {
    id: 1,
    name: "Aventurero",
    image: "personaje1.webp"
  },
  {
    id: 2,
    name: "Exploradora",
    image: "personaje2.webp"
  },
  {
    id: 3,
    name: "Valiente",
    image: "personaje3.webp"
  }
];

// Importar la estructura de datos unificada
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

// Clase para manejar los datos del usuario (copia simplificada)
class UserDataManager {
  private static readonly STORAGE_KEY = 'cresi_user_data';

  // Datos por defecto
  private static getDefaultUserData(): UserData {
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
        // Actualizar lastLogin
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

  // Guardar datos del usuario
  static saveUserData(userData: UserData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Actualizar perfil del usuario
  static updateProfile(updates: Partial<UserData['profile']>): UserData {
    const userData = this.loadUserData();
    userData.profile = { ...userData.profile, ...updates };
    this.saveUserData(userData);
    return userData;
  }

  // Verificar si es primera vez
  static isFirstTime(): boolean {
    const userData = this.loadUserData();
    return !userData.profile.username || userData.profile.username === 'Estudiante' || 
           !userData.profile.character.id || userData.profile.character.id === 0;
  }

  // Inicializar usuario completo
  static initializeUser(username: string, character: Character): UserData {
    const userData = this.getDefaultUserData();
    userData.profile.username = username;
    userData.profile.character = character;
    userData.profile.createdAt = new Date().toISOString();
    userData.profile.lastLogin = new Date().toISOString();
    this.saveUserData(userData);
    return userData;
  }
}

const CharacterSelectionModal = () => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [error, setError] = useState('');
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [showSelectionForm, setShowSelectionForm] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Cargar datos unificados
    const data = UserDataManager.loadUserData();
    setUserData(data);
    
    // Verificar si es primera vez o usuario existente
    if (!UserDataManager.isFirstTime()) {
      setUsername(data.profile.username);
      setSelectedCharacter(data.profile.character);
      setIsReturningUser(true);
    } else {
      setShowSelectionForm(true);
    }
  }, []);

  const handleSubmit = () => {
    if (!username.trim()) {
      setError('Por favor, ingresa tu nombre');
      return;
    }
    if (!selectedCharacter) {
      setError('Por favor, selecciona un personaje');
      return;
    }

    // Inicializar usuario con datos unificados
    const newUserData = UserDataManager.initializeUser(username, selectedCharacter);
    setUserData(newUserData);
    setIsOpen(false);
  };

  const handleReset = () => {
    setShowSelectionForm(true);
    setIsReturningUser(false);
  };

  const handleStartGame = () => {
    // Actualizar último login
    if (userData) {
      UserDataManager.updateProfile({
        lastLogin: new Date().toISOString()
      });
    }
    setIsOpen(false);
  };

  const handleUpdateProfile = () => {
    if (!username.trim()) {
      setError('Por favor, ingresa tu nombre');
      return;
    }
    if (!selectedCharacter) {
      setError('Por favor, selecciona un personaje');
      return;
    }

    // Actualizar perfil manteniendo el resto de datos
    const updatedData = UserDataManager.updateProfile({
      username: username,
      character: selectedCharacter
    });
    setUserData(updatedData);
    setShowSelectionForm(false);
    setIsReturningUser(true);
  };

  const getWelcomeMessage = () => {
    if (!userData) return '';
    
    const now = new Date();
    const lastLogin = new Date(userData.profile.lastLogin);
    const diffDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `¡Bienvenido de vuelta, ${userData.profile.username}!`;
    } else if (diffDays === 1) {
      return `¡Hola ${userData.profile.username}! Te extrañamos ayer.`;
    } else if (diffDays > 1) {
      return `¡Hola ${userData.profile.username}! Han pasado ${diffDays} días.`;
    }
    return `¡Bienvenido, ${userData.profile.username}!`;
  };

  if (!mounted) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <IconUser className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-medium text-gray-800 text-center mb-1">
            {isReturningUser && !showSelectionForm ? 'Tu perfil' : 'Configurar perfil'}
          </h2>
          <p className="text-gray-600 text-center text-sm">
            {isReturningUser && !showSelectionForm 
              ? 'Bienvenido a tu espacio de aprendizaje'
              : 'Personaliza tu experiencia en CrESI'
            }
          </p>
        </div>

        <div className="p-6">
          {isReturningUser && !showSelectionForm ? (
            <div className="text-center">
              {/* Returning User Content */}
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-50 mx-auto mb-4 flex items-center justify-center border-2 border-blue-100">
                  <img
                    src={userData?.profile.character.image || selectedCharacter?.image}
                    alt={userData?.profile.character.name || selectedCharacter?.name}
                    className="w-16 h-16 rounded-full object-cover"
                    loading="lazy"
                    width={64}
                    height={64}
                  />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  {getWelcomeMessage()}
                </h3>
                <p className="text-gray-500 text-sm mb-2">
                  Personaje: {userData?.profile.character.name || selectedCharacter?.name}
                </p>
                
                {/* Stats Summary */}
                {userData && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-blue-600">
                          {userData.game.totalScore}
                        </div>
                        <div className="text-xs text-gray-500">Puntos</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {userData.progress.completedActivities.length}
                        </div>
                        <div className="text-xs text-gray-500">Completadas</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-orange-600">
                          {userData.game.streak}
                        </div>
                        <div className="text-xs text-gray-500">Días seguidos</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleStartGame}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 
                           transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  Continuar
                </button>
                
                <button
                  onClick={handleReset}
                  className="w-full text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 
                           transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <IconSettings className="w-4 h-4" />
                  Cambiar configuración
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                           bg-white text-gray-800 placeholder-gray-400 text-sm"
                  placeholder="Escribe tu nombre aquí"
                />
              </div>

              {/* Character Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Elige tu avatar
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {characters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => {
                        setSelectedCharacter(character);
                        setError('');
                      }}
                      className={`p-3 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500
                        ${selectedCharacter?.id === character.id
                          ? 'bg-blue-50 ring-2 ring-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <div className="w-full aspect-square rounded-lg bg-white mb-2 flex items-center justify-center overflow-hidden shadow-sm border border-gray-200">
                        <img
                          src={character.image}
                          alt={character.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          width={64}
                          height={64}
                        />
                      </div>
                      <p className="text-center text-xs font-medium text-gray-700 leading-tight">
                        {character.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center text-red-700 text-xs font-bold">
                      !
                    </span>
                    {error}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={isReturningUser ? handleUpdateProfile : handleSubmit}
                disabled={!username.trim() || !selectedCharacter}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 
                         transition-colors font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                
                {isReturningUser ? 'Guardar cambios' : 'Comenzar'}
              </button>

              {/* Cancel Button for returning users */}
              {isReturningUser && (
                <button
                  onClick={() => {
                    setShowSelectionForm(false);
                    setIsReturningUser(true);
                    setError('');
                  }}
                  className="w-full mt-3 text-gray-500 py-2 px-4 rounded-lg hover:bg-gray-50 
                           transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {showSelectionForm && (
          <div className="px-6 pb-6">
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                {isReturningUser 
                  ? 'Los cambios se aplicarán inmediatamente a tu perfil.'
                  : 'Tu configuración se guardará automáticamente.'
                }<br />
                Puedes cambiarla cuando quieras.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSelectionModal;