"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, SmilePlus, Angry, Trophy, Medal, Star, BookOpen, BarChart3, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

// Interfaces
interface MoodEntry {
  date: string;
  mood: number;
  label: string;
  intensity: number;
  note?: string;
}

interface Stats {
  moodCounts: Record<string, number>;
  avgIntensity: string;
  totalEntries: number;
  mostCommonMood: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  date?: string;
}

interface Mood {
  value: number;
  label: string;
  color: string;
  bgColor: string;
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

  // Añadir registro de humor
  static addMoodRecord(moodRecord: MoodEntry): UserData {
    const userData = this.loadUserData();
    userData.mood.history.push(moodRecord);
    userData.mood.lastEntry = moodRecord;
    
    // Mantener solo los últimos 90 días para optimizar rendimiento
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    userData.mood.history = userData.mood.history.filter(
      record => new Date(record.date) >= ninetyDaysAgo
    );
    
    this.saveUserData(userData);
    return userData;
  }

  // Desbloquear logro
  static unlockAchievement(achievement: Achievement): UserData {
    const userData = this.loadUserData();
    const existingIndex = userData.achievements.findIndex(a => a.id === achievement.id);
    
    if (existingIndex >= 0) {
      if (!userData.achievements[existingIndex].unlocked) {
        userData.achievements[existingIndex] = { 
          ...achievement, 
          unlocked: true, 
          date: new Date().toISOString() 
        };
        // Dar puntos por logro desbloqueado
        userData.game.totalScore += this.getAchievementPoints(achievement.id);
      }
    } else {
      userData.achievements.push({ 
        ...achievement, 
        unlocked: true, 
        date: new Date().toISOString() 
      });
      userData.game.totalScore += this.getAchievementPoints(achievement.id);
    }
    
    this.saveUserData(userData);
    return userData;
  }

  // Actualizar racha y dar recompensas
  static updateStreakAndRewards(moodEntry: MoodEntry): UserData {
    const userData = this.loadUserData();
    
    // Calcular nueva racha
    const streak = this.calculateStreak(userData.mood.history.concat(moodEntry));
    userData.game.streak = streak;
    
    // Dar recompensas
    if (userData.game.totalLives < 3) {
      userData.game.totalLives += 1;
    } else {
      userData.game.totalScore += 200;
    }
    
    this.saveUserData(userData);
    return userData;
  }

  // Calcular racha de días consecutivos
  private static calculateStreak(history: MoodEntry[]): number {
    if (history.length === 0) return 0;

    let streak = 1;
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0);
    
    const lastEntry = new Date(history[history.length - 1].date).setHours(0, 0, 0, 0);
    
    if (lastEntry === today || lastEntry === yesterday) {
      for (let i = history.length - 2; i >= 0; i--) {
        const currentDate = new Date(history[i].date).setHours(0, 0, 0, 0);
        const prevDate = new Date(history[i + 1].date).setHours(0, 0, 0, 0);
        
        if ((prevDate - currentDate) === 86400000) {
          streak++;
        } else {
          break;
        }
      }
    } else {
      return 0;
    }
    
    return streak;
  }

  // Obtener puntos por tipo de logro
  private static getAchievementPoints(achievementId: string): number {
    const pointsMap: { [key: string]: number } = {
      'streak-3': 500,
      'mood-master': 1000,
      'note-taker': 750,
      'intensity-explorer': 500,
      'streak-7': 1000,
      'streak-30': 2000
    };
    return pointsMap[achievementId] || 100;
  }
}

// MoodIcon Component
const MoodIcon = ({ mood }: { mood: Mood }) => {
  switch (mood.value) {
    case 1: return <div role="img" aria-label="Angry" className={`text-4xl ${mood.color}`}>😠</div>;
    case 2: return <div role="img" aria-label="Sad" className={`text-4xl ${mood.color}`}>😢</div>;
    case 3: return <div role="img" aria-label="Annoyed" className={`text-4xl ${mood.color}`}>😤</div>;
    case 4: return <div role="img" aria-label="Depressed" className={`text-4xl ${mood.color}`}>😩</div>;
    case 5: return <div role="img" aria-label="Frustrated" className={`text-4xl ${mood.color}`}>😫</div>;
    case 6: return <div role="img" aria-label="Neutral" className={`text-4xl ${mood.color}`}>😐</div>;
    case 7: return <div role="img" aria-label="Loving" className={`text-4xl ${mood.color}`}>😍</div>;
    case 8: return <div role="img" aria-label="Happy" className={`text-4xl ${mood.color}`}>😊</div>;
    case 9: return <div role="img" aria-label="Excited" className={`text-4xl ${mood.color}`}>😋</div>;
    case 10: return <div role="img" aria-label="Very Happy" className={`text-4xl ${mood.color}`}>😄</div>;
    default: return null;
  }
};

// Achievement Icon Component
const AchievementIcon = ({ iconName, className }: { iconName: string; className: string }) => {
  switch (iconName) {
    case 'Medal': return <Medal className={className} />;
    case 'Trophy': return <Trophy className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Star': return <Star className={className} />;
    default: return null;
  }
};

const MoodTracker = () => {
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [intensityRating, setIntensityRating] = useState<number>(5);
  const [moodNote, setMoodNote] = useState('');
  const [showStats, setShowStats] = useState(false);

  const moods: Mood[] = [
    { value: 1, label: 'Enojado', color: 'text-red-400', bgColor: 'bg-red-100' },
    { value: 2, label: 'Triste', color: 'text-purple-400', bgColor: 'bg-purple-100' },
    { value: 3, label: 'Molesto', color: 'text-blue-400', bgColor: 'bg-blue-100' },
    { value: 4, label: 'Deprimido', color: 'text-gray-400', bgColor: 'bg-gray-100' },
    { value: 5, label: 'Frustrado', color: 'text-orange-400', bgColor: 'bg-orange-100' },
    { value: 6, label: 'Neutral', color: 'text-pink-400', bgColor: 'bg-pink-100' },
    { value: 7, label: 'Amoroso', color: 'text-rose-400', bgColor: 'bg-rose-100' },
    { value: 8, label: 'Feliz', color: 'text-green-400', bgColor: 'bg-green-100' },
    { value: 9, label: 'Entusiasmado', color: 'text-teal-400', bgColor: 'bg-teal-100' },
    { value: 10, label: 'Muy Feliz', color: 'text-yellow-400', bgColor: 'bg-yellow-100' }
  ];

  const moodColors: Record<string, string> = {
    'Enojado': '#f87171',
    'Triste': '#c084fc',
    'Molesto': '#60a5fa',
    'Deprimido': '#9ca3af',
    'Frustrado': '#fb923c',
    'Neutral': '#f472b6',
    'Amoroso': '#fb7185',
    'Feliz': '#4ade80',
    'Entusiasmado': '#2dd4bf',
    'Muy Feliz': '#facc15'
  };

  const defaultAchievements: Achievement[] = [
    {
      id: 'streak-3',
      name: '3 días seguidos',
      description: 'Registraste tu estado de ánimo durante 3 días consecutivos',
      iconName: 'Medal',
      unlocked: false
    },
    {
      id: 'streak-7',
      name: 'Una semana completa',
      description: 'Registraste tu estado de ánimo durante 7 días consecutivos',
      iconName: 'Trophy',
      unlocked: false
    },
    {
      id: 'mood-master',
      name: 'Maestro del Ánimo',
      description: 'Usaste todas las emociones disponibles',
      iconName: 'Trophy',
      unlocked: false
    },
    {
      id: 'note-taker',
      name: 'Reflexivo',
      description: 'Escribiste 5 notas detalladas sobre tus emociones',
      iconName: 'BookOpen',
      unlocked: false
    },
    {
      id: 'intensity-explorer',
      name: 'Explorador Emocional',
      description: 'Usaste toda la escala de intensidad (1-10)',
      iconName: 'Star',
      unlocked: false
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    
    // Inicializar achievements por defecto si no existen
    if (data.achievements.length === 0) {
      const updatedData = { ...data, achievements: defaultAchievements };
      UserDataManager.saveUserData(updatedData);
      setUserData(updatedData);
    }
  };

  const checkAchievements = (updatedHistory: MoodEntry[]) => {
    let achievementsToUnlock: Achievement[] = [];
    
    // Logro de racha de 3 días
    if (userData.game.streak >= 3) {
      const streakAchievement = userData.achievements.find(a => a.id === 'streak-3');
      if (streakAchievement && !streakAchievement.unlocked) {
        achievementsToUnlock.push(streakAchievement);
      }
    }

    // Logro de racha de 7 días
    if (userData.game.streak >= 7) {
      const streakAchievement = userData.achievements.find(a => a.id === 'streak-7');
      if (streakAchievement && !streakAchievement.unlocked) {
        achievementsToUnlock.push(streakAchievement);
      }
    }

    // Logro de usar todas las emociones
    const usedMoods = new Set(updatedHistory.map(entry => entry.mood));
    if (usedMoods.size === moods.length) {
      const moodAchievement = userData.achievements.find(a => a.id === 'mood-master');
      if (moodAchievement && !moodAchievement.unlocked) {
        achievementsToUnlock.push(moodAchievement);
      }
    }

    // Logro de escribir notas detalladas
    const notesCount = updatedHistory.filter(entry => entry.note && entry.note.length > 20).length;
    if (notesCount >= 5) {
      const noteAchievement = userData.achievements.find(a => a.id === 'note-taker');
      if (noteAchievement && !noteAchievement.unlocked) {
        achievementsToUnlock.push(noteAchievement);
      }
    }

    // Logro de explorar todas las intensidades
    const usedIntensities = new Set(updatedHistory.map(entry => entry.intensity));
    if (usedIntensities.size >= 10) {
      const intensityAchievement = userData.achievements.find(a => a.id === 'intensity-explorer');
      if (intensityAchievement && !intensityAchievement.unlocked) {
        achievementsToUnlock.push(intensityAchievement);
      }
    }

    // Desbloquear logros
    achievementsToUnlock.forEach(achievement => {
      UserDataManager.unlockAchievement(achievement);
    });

    if (achievementsToUnlock.length > 0) {
      // Recargar datos después de desbloquear logros
      const updatedData = UserDataManager.loadUserData();
      setUserData(updatedData);
    }
  };

  const calculateStats = (): Stats | null => {
    if (userData.mood.history.length === 0) return null;

    const moodCounts = userData.mood.history.reduce((acc, entry) => {
      acc[entry.label] = (acc[entry.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgIntensity = userData.mood.history.reduce((sum, entry) => sum + entry.intensity, 0) / userData.mood.history.length;

    return {
      moodCounts,
      avgIntensity: avgIntensity.toFixed(1),
      totalEntries: userData.mood.history.length,
      mostCommonMood: Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]
    };
  };

  const handleSaveMood = () => {
    if (!selectedMood) return;

    const newMoodEntry: MoodEntry = {
      date: new Date().toISOString(),
      mood: selectedMood.value,
      label: selectedMood.label,
      intensity: intensityRating,
      note: moodNote
    };
    
    // Registrar entrada de humor
    let updatedData = UserDataManager.addMoodRecord(newMoodEntry);
    
    // Actualizar racha y dar recompensas
    updatedData = UserDataManager.updateStreakAndRewards(newMoodEntry);
    
    // Actualizar estado local
    setUserData(updatedData);
    
    // Verificar logros
    checkAchievements(updatedData.mood.history);
    
    // Limpiar formulario
    setSelectedMood(null);
    setIntensityRating(5);
    setMoodNote('');
  };

  const chartData = userData.mood.history.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    valor: entry.mood,
    intensidad: entry.intensity
  }));

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded">
                <SmilePlus className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">ESI: Mood Tracker</h1>
            </div>
            <GameStatusBar 
              title="Mood Tracker"
              score={userData.game.totalScore}
              lives={userData.game.totalLives}
              level={1}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {showStats ? (
          <>
            {/* Back Button */}
            <button
              onClick={() => setShowStats(false)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a registrar
            </button>

            {/* Estadísticas */}
            {stats && (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
                    <p className="text-gray-600 text-sm font-medium">Entradas Totales</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalEntries}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
                    <p className="text-gray-600 text-sm font-medium">Racha Actual</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{userData.game.streak} días</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
                    <p className="text-gray-600 text-sm font-medium">Intensidad Promedio</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.avgIntensity}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 border-t-4 border-orange-500">
                    <p className="text-gray-600 text-sm font-medium">Emoción Más Común</p>
                    <p className="text-lg font-bold text-orange-600 mt-2">{stats.mostCommonMood}</p>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución de Emociones</h3>
                    <div className="flex justify-center">
                      <PieChart width={250} height={250}>
                        <Pie
                          dataKey="value"
                          data={Object.entries(stats.moodCounts).map(([name, value]) => ({
                            name,
                            value
                          }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {Object.entries(stats.moodCounts).map(([name]) => (
                            <Cell key={`cell-${name}`} fill={moodColors[name]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Tu Aventura Emocional</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer>
                        <LineChart data={chartData}>
                          <XAxis dataKey="date" stroke="#999" fontSize={12} />
                          <YAxis yAxisId="left" stroke="#999" domain={[0, 10]} />
                          <YAxis yAxisId="right" orientation="right" stroke="#999" />
                          <Tooltip contentStyle={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                          <Line yAxisId="left" type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line yAxisId="right" type="monotone" dataKey="intensidad" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Logros Desbloqueados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userData.achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          achievement.unlocked 
                            ? 'bg-yellow-50 border-yellow-500' 
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AchievementIcon 
                            iconName={achievement.iconName}
                            className={`w-6 h-6 flex-shrink-0 ${
                              achievement.unlocked ? 'text-yellow-500' : 'text-gray-400'
                            }`}
                          />
                          <div>
                            <h4 className="font-bold text-gray-900">{achievement.name}</h4>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                            {achievement.unlocked && achievement.date && (
                              <p className="text-xs text-gray-500 mt-1">
                                Desbloqueado: {new Date(achievement.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Quick Stats Bar */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Racha actual: <span className="font-bold text-blue-600">{userData.game.streak} días</span></span>
              </div>
              <button
                onClick={() => setShowStats(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                Ver Estadísticas
              </button>
            </div>

            {/* Mood Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">¿Cómo te sentís hoy?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => handleMoodSelect(mood)}
                    className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${
                      selectedMood?.label === mood.label 
                        ? `${mood.bgColor} ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-105` 
                        : `${mood.bgColor} hover:shadow-md`
                    }`}
                  >
                    <MoodIcon mood={mood} />
                    <span className="mt-2 text-xs font-medium text-gray-800 text-center">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity and Notes */}
            {selectedMood && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  ¿Cuál es la intensidad de tu emoción?
                </h3>
                
                <div className="mb-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={intensityRating}
                      onChange={(e) => setIntensityRating(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-2xl font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded min-w-fit">
                      {intensityRating}/10
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>Muy bajo</span>
                    <span>Muy alto</span>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Agregar una nota (opcional)
                  </label>
                  <textarea
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    placeholder="¿Qué te hizo sentir así?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
                  />
                </div>

                <button
                  onClick={handleSaveMood}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Guardar Emoción
                </button>
              </div>
            )}

            {/* Historial */}
            {userData.mood.history.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Historial Reciente</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userData.mood.history.slice().reverse().map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                      <div className="flex items-center gap-3">
                        <MoodIcon mood={moods.find(m => m.value === entry.mood) || moods[0]} />
                        <div>
                          <p className="font-medium text-gray-900">{entry.label}</p>
                          <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-700">Intensidad: {entry.intensity}/10</p>
                        {entry.note && <p className="text-xs text-gray-500 max-w-xs truncate">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MoodTracker;