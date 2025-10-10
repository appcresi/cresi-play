"use client"
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  IconAB2,
  IconCards,
  IconMoodPuzzled,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodTongueWink2,
  IconSearch,
  IconX,
  IconHeart,
  IconTrophy,
  IconMoodHappy,
  IconEdit,
  IconTarget,
  IconStar,
  IconProgress,
  IconCircle,
  IconCalendar,
  IconUser,
  IconBook,
  IconChevronRight,
  IconPlus
} from "@tabler/icons-react";

const features = [
  {
    title: "Trivias",
    description: "Poné a prueba tus conocimientos jugando trivias sobre salud, derechos, diversidad y mucho más.",
    icon: <IconCards size={20} />,
    route: "/trivias",
    color: "#1976D2",
    image: "/trivia.svg",
    priority: true,
    category: "Evaluación",
    dueDate: ""
  },
  {
    title: "Pasapalabras",
    description: "Jugá con las letras del abecedario y descubrí palabras claves a partir de sus definiciones.",
    icon: <IconAB2 size={20} />,
    route: "/pasapalabras",
    color: "#388E3C",
    image: "/pasapalabras.svg",
    priority: true,
    category: "Ejercicios",
    dueDate: ""
  },
  {
    title: "Simulador Grooming",
    description: "Practicá cómo reaccionar ante mensajes sospechosos y aprendé a cuidarte en las redes sociales.",
    icon: <IconShieldCheck size={20} />,
    route: "/simulador",
    color: "#F57C00",
    image: "/simulador.svg",
    priority: true,
    category: "Seguridad",
    dueDate: ""
  },
  {
    title: "Completa Palabras",
    description: "Completá frases con las palabras correctas y descubrí conceptos sobre sexualidad, cuidado y derechos.",
    icon: <IconBrandPnpm size={20} />,
    route: "/completapalabras",
    color: "#7B1FA2",
    image: "/completa.svg",
    category: "Ejercicios",
    dueDate: ""
  },
  {
    title: "DataMuncher",
    description: "Recorré el laberinto, respondé preguntas y esquivá bacterias para sumar puntos así ganar el juego.",
    icon: <IconPacman size={20} />,
    route: "/datamuncher",
    color: "#D32F2F",
    image: "/datamuncher.svg",
    category: "Juegos Educativos",
    dueDate: ""
  },
  {
    title: "MoodTracker",
    description: "Reflexioná sobre cómo te sentís, registrá tus emociones y aprendé a expresar tu estado de ánimo.",
    icon: <IconMoodPuzzled size={20} />,
    route: "/moodtracker",
    color: "#0288D1",
    image: "/moodtracker.svg",
    category: "Bienestar",
    dueDate: ""
  },
  {
    title: "Meme Generator",
    description: "Creá memes originales con mensajes reflexivos y compartilos con tus amistades.",
    icon: <IconMoodTongueWink2 size={20} />,
    route: "/memegenerador",
    color: "#689F38",
    image: "/meme.svg",
    category: "Creatividad",
    dueDate: ""
  },
  {
    title: "Literatura",
    description: "Leé cuentos breves y relatos que invitan a reflexionar sobre vínculos, derechos y emociones.",
    icon: <IconBook size={20} />,
    route: "/literatura",
    color: "#5D4037",
    image: "/literatura.svg",
    category: "Lectura",
    dueDate: ""
  },
  {
    title: "BioPuzzle",
    description: "Completá el rompecabezas de la biología humana y aprendé sobre el cuerpo humano de forma divertida.",
    icon: <IconMoodPuzzled size={24} />,
    route: "/biopuzzle",
    color: "#FFD93D",
    image: "/biopluzzle.svg",
    category: "Lectura",
    dueDate: ""
  },
  {
    title: "Prevención",
    description: "Todo sobre el preservativo, el único método que reduce la posibilidad de contraer un ITS.",
    icon: <IconMoodPuzzled size={24} />,
    route: "/condon",
    color: "#FF6B6B",
    image: "/condon.svg",
    category: "Lectura",
    dueDate: ""
  }
];

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
    activityTimes: { [key: string]: string }; // Incluye tanto visitas como completaciones
    lastVisits: { [key: string]: string }; // Específicamente para visitas
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

  // Actualizar perfil del usuario
  static updateProfile(updates: Partial<UserData['profile']>): UserData {
    const userData = this.loadUserData();
    userData.profile = { ...userData.profile, ...updates };
    this.saveUserData(userData);
    return userData;
  }

  // Actualizar datos de juego
  static updateGameData(updates: Partial<UserData['game']>): UserData {
    const userData = this.loadUserData();
    userData.game = { ...userData.game, ...updates };
    this.saveUserData(userData);
    return userData;
  }

  // Registrar visita a actividad
  static visitActivity(activityTitle: string): UserData {
    console.log('UserDataManager - Registrando visita:', activityTitle); // Debug
    const userData = this.loadUserData();
    
    if (!userData.progress.lastVisits) {
      userData.progress.lastVisits = {};
    }
    
    userData.progress.lastVisits[activityTitle] = new Date().toISOString();
    console.log('UserDataManager - Datos actualizados:', userData.progress.lastVisits); // Debug
    this.saveUserData(userData);
    return userData;
  }

  // Marcar actividad como completada
  static completeActivity(activityTitle: string, score: number = 0): UserData {
    const userData = this.loadUserData();
    
    if (!userData.progress.completedActivities.includes(activityTitle)) {
      userData.progress.completedActivities.push(activityTitle);
    }
    
    userData.progress.activityScores[activityTitle] = score;
    userData.progress.activityTimes[activityTitle] = new Date().toISOString();
    
    // Actualizar puntaje total
    userData.game.totalScore += score;
    
    this.saveUserData(userData);
    return userData;
  }

  // Añadir registro de humor
  static addMoodRecord(moodRecord: MoodRecord): UserData {
    const userData = this.loadUserData();
    userData.mood.history.push(moodRecord);
    userData.mood.lastEntry = moodRecord;
    
    // Mantener solo los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    userData.mood.history = userData.mood.history.filter(
      record => new Date(record.date) >= thirtyDaysAgo
    );
    
    this.saveUserData(userData);
    return userData;
  }

  // Desbloquear logro
  static unlockAchievement(achievement: Achievement): UserData {
    const userData = this.loadUserData();
    const existingIndex = userData.achievements.findIndex(a => a.id === achievement.id);
    
    if (existingIndex >= 0) {
      userData.achievements[existingIndex] = { ...achievement, unlocked: true, date: new Date().toISOString() };
    } else {
      userData.achievements.push({ ...achievement, unlocked: true, date: new Date().toISOString() });
    }
    
    this.saveUserData(userData);
    return userData;
  }

  // Actualizar configuraciones
  static updateSettings(updates: Partial<UserData['settings']>): UserData {
    const userData = this.loadUserData();
    userData.settings = { ...userData.settings, ...updates };
    this.saveUserData(userData);
    return userData;
  }

  // Resetear todos los datos
  static resetAllData(): UserData {
    const defaultData = this.getDefaultUserData();
    this.saveUserData(defaultData);
    return defaultData;
  }

  // Exportar datos para backup
  static exportData(): string {
    const userData = this.loadUserData();
    return JSON.stringify(userData, null, 2);
  }

  // Importar datos desde backup
  static importData(dataString: string): boolean {
    try {
      const userData = JSON.parse(dataString) as UserData;
      this.saveUserData(userData);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

const EducationalProgressPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
  };

  const categories = ['Todos', ...Array.from(new Set(features.map(f => f.category)))];

  const filteredFeatures = useMemo(() => {
    let filtered = features;
    
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(feature => feature.category === selectedCategory);
    }
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(feature =>
        feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [searchTerm, selectedCategory]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getActivityProgress = (activityTitle: string) => {
    return userData.progress.completedActivities.includes(activityTitle);
  };

  const getActivityScore = (activityTitle: string) => {
    return userData.progress.activityScores[activityTitle] || 0;
  };

  const getLastVisitDate = (activityTitle: string) => {
    console.log('Obteniendo fecha para:', activityTitle, userData.progress.lastVisits?.[activityTitle]); // Debug
    const lastVisit = userData.progress.lastVisits?.[activityTitle];
    if (!lastVisit) return null;
    return new Date(lastVisit);
  };

  const formatLastVisit = (activityTitle: string) => {
    console.log('Formateando fecha para:', activityTitle, userData.progress.lastVisits); // Debug
    const lastVisit = getLastVisitDate(activityTitle);
    if (!lastVisit) return "Sin visitar";

    const now = new Date();
    const diffMs = now.getTime() - lastVisit.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `Hace ${diffMinutes} min`;
    } else {
      return "Ahora mismo";
    }
  };

  const handleActivityClick = (activityTitle: string, e: React.MouseEvent) => {
    e.preventDefault(); // Evitar la navegación inmediata del Link
    console.log('Registrando visita para:', activityTitle); // Debug
    UserDataManager.visitActivity(activityTitle);
    
    // Recargar datos para reflejar cambios inmediatamente
    const updatedData = UserDataManager.loadUserData();
    setUserData(updatedData);
    
    // Navegar manualmente después de registrar la visita
    setTimeout(() => {
      window.location.href = features.find(f => f.title === activityTitle)?.route || '/';
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Tu Progreso</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconCircle size={16} className="text-green-600" />
                    <span className="text-sm text-gray-700">Completadas</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {userData.progress.completedActivities.length}/{features.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconTrophy size={16} className="text-yellow-500" />
                    <span className="text-sm text-gray-700">Puntos</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{userData.game.totalScore}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconTarget size={16} className="text-blue-600" />
                    <span className="text-sm text-gray-700">Racha</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{userData.game.streak} días</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconHeart size={16} className="text-red-500" />
                    <span className="text-sm text-gray-700">Vidas</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{userData.game.totalLives}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(userData.progress.completedActivities.length / features.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round((userData.progress.completedActivities.length / features.length) * 100)}% completado
                </p>
              </div>
            </div>

            {/* Mood Card */}
            {userData.mood.lastEntry && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Estado de Ánimo</h3>
                  <button
                    onClick={() => window.location.href = '/moodtracker'}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <IconEdit size={16} />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <IconMoodHappy className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{userData.mood.lastEntry.label}</p>
                    <p className="text-xs text-gray-500">Hoy</p>
                  </div>
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Categorías</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconSearch size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <IconX size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Activities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFeatures.length > 0 ? (
                filteredFeatures.map((feature, index) => {
                  const isCompleted = getActivityProgress(feature.title);
                  const activityScore = getActivityScore(feature.title);
                  
                  return (
                    <div 
                      key={feature.title}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={(e) => handleActivityClick(feature.title, e)}
                    >
                        {/* Header */}
                        <div className="relative">
                          <div 
                            className="h-24 rounded-t-lg flex items-center justify-center relative overflow-hidden"
                            style={{ backgroundColor: `${feature.color}15` }}
                          >
                            {/* Imagen de fondo */}
                            <div className="absolute inset-0 opacity-20">
                              <Image
                                src={feature.image}
                                alt=""
                                fill
                                className="object-cover object-center"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                            
                            {/* Ícono circular en primer plano */}
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center relative z-10"
                              style={{ backgroundColor: feature.color }}
                            >
                              <div className="text-white">
                                {feature.icon}
                              </div>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          {isCompleted && (
                            <div className="absolute top-2 right-2">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <IconCircle size={14} className="text-white" />
                              </div>
                            </div>
                          )}

                          {/* Last Visit Date */}
                          <div className="absolute bottom-2 left-3">
                            <div className={`flex items-center space-x-1 text-xs backdrop-blur-sm rounded-full px-2 py-1 ${
                              getLastVisitDate(feature.title) 
                                ? 'text-gray-600 bg-white/80' 
                                : 'text-orange-600 bg-orange-50/80'
                            }`}>
                              <IconCalendar size={12} />
                              <span>{formatLastVisit(feature.title)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                              {feature.title}
                            </h3>
                            <IconChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                            {feature.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span 
                              className="inline-block px-2 py-1 text-xs font-medium rounded-full"
                              style={{ 
                                backgroundColor: `${feature.color}15`,
                                color: feature.color 
                              }}
                            >
                              {feature.category}
                            </span>
                            
                            {isCompleted && (
                              <div className="flex items-center space-x-2">
                                {activityScore > 0 && (
                                  <span className="text-xs text-yellow-600 font-medium">
                                    {activityScore} pts
                                  </span>
                                )}
                                <span className="text-xs text-green-600 font-medium">
                                  Completado
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <IconSearch size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron actividades
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Intentá con otros términos de búsqueda o cambiá la categoría.
                    </p>
                    <button
                      onClick={() => {
                        clearSearch();
                        setSelectedCategory('Todos');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Ver todas las actividades
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default EducationalProgressPanel;