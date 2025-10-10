"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, SmilePlus, Angry, Trophy, Medal, Star, BookOpen } from 'lucide-react';
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

    // Marcar actividad como visitada
    // UserDataManager.visitActivity?.('MoodTracker');
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
    <div className="min-h-screen bg-yellow-50 p-6 pt-24">
      <GameStatusBar 
        title="Mood Tracker"
        score={userData.game.totalScore}
        lives={userData.game.totalLives}
        level={1}
      />
      
      {/* Racha y Estadísticas Rápidas */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-lg border-4 border-black transform -rotate-2">
          <Calendar className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-lg font-bold">Racha actual</p>
            <p className="text-3xl font-bold text-orange-500">{userData.game.streak} días</p>
          </div>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold 
                     border-4 border-black transform rotate-2 hover:rotate-0 
                     transition-transform duration-200"
        >
          {showStats ? '← Volver' : 'Ver Estadísticas 📊'}
        </button>
      </div>

      {showStats ? (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Estadísticas Detalladas */}
          {stats && (
            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 transform rotate-1 max-w-full">
              <h2 className="text-2xl font-bold mb-6">📊 Tus Estadísticas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <div className="w-full max-w-xs">
                    <h3 className="text-xl font-bold mb-4 text-center">Distribución de Emociones</h3>
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
                <div className="space-y-4">
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-lg font-bold">Entradas Totales</p>
                    <p className="text-3xl font-bold text-blue-500">{stats.totalEntries}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-lg font-bold">Intensidad Promedio</p>
                    <p className="text-3xl font-bold text-green-500">{stats.avgIntensity}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-lg font-bold">Emoción más común</p>
                    <p className="text-3xl font-bold text-purple-500">{stats.mostCommonMood}</p>
                  </div>
                </div>
              </div>
            </div>         
          )}

          {/* Logros */}
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 transform -rotate-1">
            <h2 className="text-2xl font-bold mb-6">🏆 Logros Desbloqueados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transform hover:scale-105 transition-transform
                    ${achievement.unlocked 
                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-500' 
                      : 'bg-gray-100 border-gray-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <AchievementIcon 
                      iconName={achievement.iconName}
                      className={`w-8 h-8 ${
                        achievement.unlocked ? 'text-yellow-500' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <h3 className="font-bold">{achievement.name}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      {achievement.unlocked && achievement.date && (
                        <p className="text-xs text-gray-500">
                          Desbloqueado: {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Grid de Emociones */}
          <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 transform rotate-1">
            <p className="text-xl font-bold mb-3 text-center">¿Cómo te sentís hoy?</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => handleMoodSelect(mood)}
                  className={`relative p-4 rounded-lg flex flex-col items-center transition-all
                    ${mood.bgColor} border-4 border-black
                    ${selectedMood?.label === mood.label 
                      ? 'transform scale-110 shadow-xl' 
                      : 'hover:scale-105 hover:shadow-lg'}
                    transform hover:-rotate-3 transition-transform duration-200`}
                >
                  <MoodIcon mood={mood} />
                  <span className="mt-1 text-sm font-medium text-gray-800">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Intensidad y Notas */}
          {selectedMood && (
            <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border-4 border-black transform rotate-1">
              <h3 className="text-xl font-bold mb-3 text-center">
                Del 1 al 10, ¿Cómo te sentís? 
              </h3>
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensityRating}
                    onChange={(e) => setIntensityRating(parseInt(e.target.value))}
                    className="w-full h-6 appearance-none cursor-pointer bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full"
                  />
                  <span className="text-3xl font-bold px-4 py-2 bg-yellow-400 rounded-full border-4 border-black transform -rotate-3 shadow-lg">
                    {intensityRating}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg mt-4">
                  <div className="flex items-center gap-2 transform -rotate-6">
                    <Angry className="w-8 h-8 text-red-500" strokeWidth={3} />
                    <span className="font-bold text-red-500">¡Muy mal!</span>
                  </div>
                  <div className="flex items-center gap-2 transform rotate-6">
                    <SmilePlus className="w-8 h-8 text-green-500" strokeWidth={3} />
                    <span className="font-bold text-green-500">¡Muy bien!</span>
                  </div>
                </div>
              </div>

              {/* Campo de Notas */}
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-3">¿Quieres agregar una nota? 📝</h3>
                <textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="¿Qué te hizo sentir así? ¡Cuéntanos tu historia!"
                  className="w-full p-4 border-2 border-gray-300 rounded-lg h-32 
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <button
                onClick={handleSaveMood}
                className="mt-6 w-full px-8 py-3 bg-yellow-400 text-black rounded-xl 
                         font-bold border-4 border-black transform hover:-rotate-2 
                         hover:scale-105 transition-transform duration-200 shadow-lg
                         hover:shadow-xl active:translate-y-1"
                style={{ 
                  fontFamily: 'comic sans ms, cursive',
                  textShadow: '1px 1px 0 #fff'
                }}
              >
                ¡GUARDAR EMOCIÓN! 💪
              </button>
            </div>
          )}

          {/* Gráfico de Historia */}
          {userData.mood.history.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6 transform -rotate-1">
              <h2 className="text-2xl font-bold mb-4 text-purple-600" 
                  style={{ textShadow: '1px 1px 0 #000' }}>
                ¡Tu Aventura Emocional!
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#000000"
                      fontSize={12}
                      strokeWidth={2}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#000000"
                      fontSize={12}
                      strokeWidth={2}
                      ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                      tickFormatter={(value) => {
                        const mood = moods.find(m => m.value === value);
                        return mood ? mood.label : value;
                      }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#FF0000"
                      domain={[1, 10]}
                      ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                      label={{ value: 'Intensidad', angle: 90, position: 'right' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'white',
                        border: '3px solid black',
                        borderRadius: '8px',
                        padding: '8px'
                      }}
                      formatter={(value, name) => {
                        if (name === 'valor') {
                          const mood = moods.find(m => m.value === value);
                          return [mood ? mood.label : value, 'Estado'];
                        }
                        if (name === 'intensidad') {
                          return [value, 'Intensidad'];
                        }
                        return [value, name];
                      }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="valor" 
                      stroke="#6366f1"
                      strokeWidth={4}
                      dot={{ 
                        fill: '#6366f1',
                        strokeWidth: 2,
                        r: 6,
                        strokeDasharray: '' 
                      }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="intensidad" 
                      stroke="#FF0000"
                      strokeWidth={4}
                      dot={{ 
                        fill: '#FF0000',
                        strokeWidth: 2,
                        r: 6,
                        strokeDasharray: '' 
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoodTracker;