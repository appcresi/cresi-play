"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, SmilePlus, Angry, Trophy, Medal, Star, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import GameStatusBar from '@/components/GameStatusBar';

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
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
}

interface Mood {
  value: number;
  label: string;
  color: string;
  bgColor: string;
}

// MoodIcon Component
const MoodIcon = ({ mood }: { mood: Mood }) => {
  const iconProps = {
    className: `w-16 h-16 ${mood.color}`,
    strokeWidth: 3
  };

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
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [intensityRating, setIntensityRating] = useState<number>(5);
  const [gameScore, setGameScore] = useState(0);
  const [gameLives, setGameLives] = useState(3);
  const [moodNote, setMoodNote] = useState('');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streakCount, setStreakCount] = useState(0);
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
      title: '¡3 días seguidos!',
      description: 'Registraste tu estado de ánimo durante 3 días consecutivos',
      iconName: 'Medal',
      unlocked: false
    },
    {
      id: 'mood-master',
      title: 'Maestro del Ánimo',
      description: 'Usaste todas las emociones disponibles',
      iconName: 'Trophy',
      unlocked: false
    },
    {
      id: 'note-taker',
      title: 'Reflexivo',
      description: 'Escribiste 5 notas detalladas sobre tus emociones',
      iconName: 'BookOpen',
      unlocked: false
    },
    {
      id: 'intensity-explorer',
      title: 'Explorador Emocional',
      description: 'Usaste toda la escala de intensidad (1-10)',
      iconName: 'Star',
      unlocked: false
    }
  ];

  useEffect(() => {
    const savedMoods = localStorage.getItem('moodHistory');
    const savedScore = localStorage.getItem('totalGameScore');
    const savedLives = localStorage.getItem('totalGameLives');
    const savedAchievements = localStorage.getItem('achievements');
    
    if (savedMoods) {
      setMoodHistory(JSON.parse(savedMoods));
    }
    if (savedScore) {
      setGameScore(parseInt(savedScore));
    }
    if (savedLives) {
      setGameLives(parseInt(savedLives));
    }
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    } else {
      setAchievements(defaultAchievements);
    }

    if (savedMoods) {
      checkStreak(JSON.parse(savedMoods));
    }
  }, []);

  const checkAchievements = (updatedHistory: MoodEntry[]) => {
    const newAchievements = [...achievements];
    
    if (streakCount >= 3) {
      const streakAchievement = newAchievements.find(a => a.id === 'streak-3');
      if (streakAchievement && !streakAchievement.unlocked) {
        streakAchievement.unlocked = true;
        setGameScore(prev => prev + 500);
      }
    }

    const usedMoods = new Set(updatedHistory.map(entry => entry.mood));
    if (usedMoods.size === moods.length) {
      const moodAchievement = newAchievements.find(a => a.id === 'mood-master');
      if (moodAchievement && !moodAchievement.unlocked) {
        moodAchievement.unlocked = true;
        setGameScore(prev => prev + 1000);
      }
    }

    const notesCount = updatedHistory.filter(entry => entry.note && entry.note.length > 20).length;
    if (notesCount >= 5) {
      const noteAchievement = newAchievements.find(a => a.id === 'note-taker');
      if (noteAchievement && !noteAchievement.unlocked) {
        noteAchievement.unlocked = true;
        setGameScore(prev => prev + 750);
      }
    }

    const usedIntensities = new Set(updatedHistory.map(entry => entry.intensity));
    if (usedIntensities.size >= 10) {
      const intensityAchievement = newAchievements.find(a => a.id === 'intensity-explorer');
      if (intensityAchievement && !intensityAchievement.unlocked) {
        intensityAchievement.unlocked = true;
        setGameScore(prev => prev + 500);
      }
    }

    setAchievements(newAchievements);
    localStorage.setItem('achievements', JSON.stringify(newAchievements));
  };

  const checkStreak = (history: MoodEntry[]) => {
    if (history.length === 0) return;

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
    }
    
    setStreakCount(streak);
  };

  const calculateStats = (): Stats | null => {
    if (moodHistory.length === 0) return null;

    const moodCounts = moodHistory.reduce((acc, entry) => {
      acc[entry.label] = (acc[entry.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgIntensity = moodHistory.reduce((sum, entry) => sum + entry.intensity, 0) / moodHistory.length;

    return {
      moodCounts,
      avgIntensity: avgIntensity.toFixed(1),
      totalEntries: moodHistory.length,
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
    
    const updatedHistory = [...moodHistory, newMoodEntry];
    setMoodHistory(updatedHistory);
    localStorage.setItem('moodHistory', JSON.stringify(updatedHistory));
    
    checkStreak(updatedHistory);
    checkAchievements(updatedHistory);

    setSelectedMood(null);
    setIntensityRating(5);
    setMoodNote('');

    if (gameLives < 3) {
      const newLives = gameLives + 1;
      setGameLives(newLives);
      localStorage.setItem('totalGameLives', newLives.toString());
    } else {
      const newScore = gameScore + 200;
      setGameScore(newScore);
      localStorage.setItem('totalGameScore', newScore.toString());
    }
  };

  const chartData = moodHistory.map(entry => ({
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
        score={gameScore}
        lives={gameLives}
        level={1}
      />
      
      {/* Racha y Estadísticas Rápidas */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-lg border-4 border-black transform -rotate-2">
          <Calendar className="w-8 h-8 text-orange-500" />
          <div>
            <p className="text-lg font-bold">Racha actual</p>
            <p className="text-3xl font-bold text-orange-500">{streakCount} días</p>
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
              {achievements.map((achievement) => (
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
                      <h3 className="font-bold">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
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
          {moodHistory.length > 0 && (
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