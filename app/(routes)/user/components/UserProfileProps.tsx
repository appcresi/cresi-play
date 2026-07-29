"use client"
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    IconHeart,
    IconTrophy,
    IconHeartPlus,
    IconMoodHappy,
    IconEdit,
    IconTrash,
    IconTarget,
    IconCalendar,
    IconUser
} from "@tabler/icons-react";
import PurchaseModal from '@/components/PurchaseModal';
import Swal from 'sweetalert2';


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
    history: MoodRecord[];
    lastEntry: MoodRecord | null;
  };
  achievements: Achievement[];
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en';
  };
}

interface MoodRecord {
  date: string;
  mood: number;
  label: string;
  intensity: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  date?: string;
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

  // Actualizar datos de juego
  static updateGameData(updates: Partial<UserData['game']>): UserData {
    const userData = this.loadUserData();
    userData.game = { ...userData.game, ...updates };
    this.saveUserData(userData);
    return userData;
  }

  // Resetear todos los datos manteniendo perfil
  static resetGameData(): UserData {
    const userData = this.loadUserData();
    userData.game = {
      totalScore: 0,
      totalLives: 3,
      streak: 0
    };
    userData.progress = {
      completedActivities: [],
      activityScores: {},
      activityTimes: {},
      lastVisits: {}
    };
    userData.mood = {
      history: [],
      lastEntry: null
    };
    userData.achievements = [];
    this.saveUserData(userData);
    return userData;
  }

  // Comprar vida
  static purchaseLife(cost: number): { success: boolean; userData?: UserData; error?: string } {
    const userData = this.loadUserData();
    
    if (userData.game.totalLives >= 3) {
      return { success: false, error: 'Ya tienes el máximo de vidas' };
    }
    
    if (userData.game.totalScore < cost) {
      return { success: false, error: 'No tienes suficientes puntos' };
    }
    
    userData.game.totalLives += 1;
    userData.game.totalScore -= cost;
    this.saveUserData(userData);
    
    return { success: true, userData };
  }

  // Obtener estadísticas resumidas
  static getStats(userData?: UserData): {
    daysActive: number;
    totalActivities: number;
    averageScore: number;
    lastActivity: string | null;
  } {
    // FIX: aceptar userData como parámetro para evitar leer datos viejos de localStorage
    const data = userData ?? this.loadUserData();
    
    const createdDate = new Date(data.profile.createdAt);
    const now = new Date();
    const daysActive = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const totalActivities = data.progress.completedActivities.length;
    const totalScore = data.game.totalScore;
    const averageScore = totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0;
    
    // Buscar la actividad más reciente
    const lastActivityTime = Math.max(
      ...Object.values(data.progress.activityTimes).map(time => new Date(time).getTime()),
      0
    );
    
    const lastActivity = lastActivityTime > 0 
      ? Object.entries(data.progress.activityTimes)
          .find(([, time]) => new Date(time).getTime() === lastActivityTime)?.[0] || null
      : null;
    
    return {
      daysActive,
      totalActivities,
      averageScore,
      lastActivity
    };
  }
}

interface UserProfileProps {
  initialData?: {
    character?: any;
    username?: string;
    totalGameLives?: number;
    totalGameScore?: number;
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ initialData }) => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [stats, setStats] = useState({
    daysActive: 0,
    totalActivities: 0,
    averageScore: 0,
    lastActivity: null as string | null
  });

  // FIX: el efecto solo corre al montar el componente, sin depender de initialData
  // para evitar que re-cargas desde localStorage sobreescriban el estado luego de una compra
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    // FIX: pasar los datos frescos directamente a getStats para evitar leer localStorage dos veces
    const userStats = UserDataManager.getStats(data);
    setStats(userStats);
  };

  const handleDeleteHistory = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción! Se borrará todo tu progreso de juegos y actividades, pero se mantendrá tu perfil.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, bórralo',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      customClass: {
        popup: 'comic-popup'
      }
    });

    if (result.isConfirmed) {
      const resetData = UserDataManager.resetGameData();
      setUserData(resetData);
      // FIX: pasar resetData directamente para consistencia
      const userStats = UserDataManager.getStats(resetData);
      setStats(userStats);

      await Swal.fire({
        title: '¡Progreso reiniciado!',
        text: 'Tu progreso de juegos ha sido eliminado. Tu perfil se mantiene intacto.',
        icon: 'success',
        customClass: {
          popup: 'comic-popup'
        }
      });
    }
  };

  const handlePurchaseLife = () => {
    // PurchaseModal ya hizo la compra y guardó en localStorage.
    // Solo releer el estado actualizado y sincronizar React.
    const updatedData = UserDataManager.loadUserData();
    setUserData(updatedData);
    const userStats = UserDataManager.getStats(updatedData);
    setStats(userStats);
    setIsPurchaseModalOpen(false);
  };

  const handleUpdateMood = () => {
    router.push('/moodtracker');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUsingApp = () => {
    const created = new Date(userData.profile.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 h-48 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <svg className="w-full h-full opacity-20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="20" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-10">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {userData.profile.character.image ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                    <Image
                      src={`/${userData.profile.character.image.replace(/^\/+/, '')}`}
                      alt={userData.profile.character.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                    <IconUser size={40} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-grow">
                <h1 className="text-3xl font-normal text-gray-900 mb-1">
                  {userData.profile.username || 'Estudiante'}
                </h1>
                <p className="text-lg text-gray-600 mb-3">
                  {userData.profile.character.name || 'Sin personaje seleccionado'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <IconCalendar size={16} />
                    Miembro desde {formatDate(userData.profile.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconTarget size={16} />
                    {getDaysUsingApp()} días activo
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleUpdateMood}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium border border-gray-300 hover:border-blue-300"
                >
                  Actualizar estado
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Game Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <IconTrophy size={20} className="text-amber-500" />
              Estadísticas de juego
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <IconHeart size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Vidas</p>
                    <p className="text-xs text-gray-500">Disponibles</p>
                  </div>
                </div>
                <span className="text-2xl font-semibold text-gray-900">{userData.game.totalLives}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                    <IconTrophy size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Puntos</p>
                    <p className="text-xs text-gray-500">Total acumulado</p>
                  </div>
                </div>
                <span className="text-2xl font-semibold text-gray-900">{userData.game.totalScore}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <IconTarget size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Racha</p>
                    <p className="text-xs text-gray-500">Días consecutivos</p>
                  </div>
                </div>
                <span className="text-2xl font-semibold text-gray-900">{userData.game.streak}</span>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <IconEdit size={20} className="text-green-500" />
              Progreso académico
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Actividades completadas</span>
                  <span className="text-sm text-gray-500">{userData.progress.completedActivities.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((userData.progress.completedActivities.length / 10) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.min(Math.round((userData.progress.completedActivities.length / 10) * 100), 100)}% del programa
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Promedio por actividad</span>
                  <span className="text-lg font-semibold text-gray-900">{stats.averageScore}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Logros desbloqueados</span>
                <span className="text-lg font-semibold text-gray-900">
                  {userData.achievements.filter(a => a.unlocked).length}
                </span>
              </div>
            </div>
          </div>

          {/* Mood & Activity Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <IconMoodHappy size={20} className="text-purple-500" />
              Estado y actividad
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <IconMoodHappy size={24} className="text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Estado actual</p>
                    <p className="text-lg font-semibold text-purple-700">
                      {userData.mood.lastEntry?.label || 'Sin registro'}
                    </p>
                  </div>
                </div>
                {userData.mood.lastEntry && (
                  <p className="text-xs text-gray-600">
                    Registrado {new Date(userData.mood.lastEntry.date).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
              
              {stats.lastActivity && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">Última actividad</p>
                  <p className="text-sm text-gray-600">{stats.lastActivity}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Registros de humor: {userData.mood.history.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones rápidas</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              disabled={userData.game.totalLives >= 3 || userData.game.totalScore < 200}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                userData.game.totalLives >= 3 || userData.game.totalScore < 200
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
              }`}
            >
              <IconHeartPlus size={18} />
              Comprar vida (200 puntos)
            </button>

            <button
              onClick={handleDeleteHistory}
              className="flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md"
            >
              <IconTrash size={18} />
              Reiniciar progreso
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                  <span className="text-amber-700 text-sm font-bold">!</span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">Información importante</h4>
                <p className="text-sm text-amber-700">
                  Al reiniciar el progreso se mantendrá tu perfil, pero se eliminarán todos los datos de juegos, actividades, estados de ánimo y logros.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchase={handlePurchaseLife}
      />
    </div>
  );
};

export default UserProfile;